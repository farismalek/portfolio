<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    fetchMyCreatorProfile,
    fetchCreatorStats,
    fetchCreatorProducts,
    fetchCreatorEarnings,
  } from "$lib/services/creatorService";
  import type {
    CreatorProfile,
    CreatorStats,
    CreatorProduct,
    CreatorEarning,
  } from "$lib/types/creator";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import DataTable from "$lib/components/analytics/DataTable.svelte";
  import Chart from "$lib/components/analytics/Chart.svelte";

  let loading = true;
  let error: string | null = null;
  let profile: CreatorProfile | null = null;
  let stats: CreatorStats | null = null;
  let products: CreatorProduct[] = [];
  let earnings: CreatorEarning[] = [];
  let activeTab = "overview";
  let selectedPeriod = "month";

  onMount(async () => {
    try {
      // Fetch creator profile and stats
      [profile, stats] = await Promise.all([
        fetchMyCreatorProfile(),
        fetchCreatorStats(selectedPeriod),
      ]);

      // Load products and earnings
      await Promise.all([loadProducts(), loadEarnings()]);

      loading = false;
    } catch (err) {
      if (err.message === "Creator profile not found") {
        // Redirect to creator onboarding
        goto("/creators/onboarding");
        return;
      }

      error = err.message || "Failed to load creator dashboard";
      loading = false;
    }
  });

  async function loadProducts() {
    try {
      products = await fetchCreatorProducts();
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }

  async function loadEarnings() {
    try {
      earnings = await fetchCreatorEarnings();
    } catch (err) {
      console.error("Failed to load earnings:", err);
    }
  }

  async function changePeriod(period) {
    selectedPeriod = period;
    try {
      stats = await fetchCreatorStats(period);
    } catch (err) {
      console.error("Failed to load stats for period:", period, err);
    }
  }

  // Format currency
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Format date
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Creator Dashboard | Portfolia</title>
  <meta
    name="description"
    content="Manage your creator profile, products, and earnings"
  />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  {#if loading}
    <div class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <AlertBox type="error" class="my-8">
      {error}
      <Button
        variant="outline"
        size="sm"
        class="mt-2"
        on:click={() => window.location.reload()}
      >
        Retry
      </Button>
    </AlertBox>
  {:else if profile}
    <PageHeader
      title="Creator Dashboard"
      description="Manage your products and track your earnings"
    >
      <div>
        <Button variant="primary" href="/creators/products/new">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create Product
        </Button>
      </div>
    </PageHeader>

    <Tabs
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "products", label: "Products" },
        { id: "earnings", label: "Earnings" },
        { id: "analytics", label: "Analytics" },
        { id: "settings", label: "Settings" },
      ]}
      bind:activeTab
    />

    <!-- Overview Tab -->
    {#if activeTab === "overview"}
      <div class="mt-6 space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div class="p-4">
              <h3 class="text-sm font-medium text-neutral-500 mb-1">
                Total Revenue
              </h3>
              <div class="text-2xl font-bold">
                {formatCurrency(stats?.revenue.totalLifetime || 0)}
              </div>
              <div class="mt-4 flex items-center">
                <span class="text-sm text-neutral-500 mr-2">This month:</span>
                <span class="font-medium"
                  >{formatCurrency(stats?.revenue.currentMonth || 0)}</span
                >
                {#if stats?.revenue.monthlyChange}
                  <span
                    class={stats.revenue.monthlyChange > 0
                      ? "text-green-600 ml-2"
                      : "text-red-600 ml-2"}
                  >
                    {stats.revenue.monthlyChange > 0 ? "+" : ""}{stats.revenue
                      .monthlyChange}%
                  </span>
                {/if}
              </div>
            </div>
          </Card>

          <Card>
            <div class="p-4">
              <h3 class="text-sm font-medium text-neutral-500 mb-1">
                Products
              </h3>
              <div class="text-2xl font-bold">{stats?.products.total || 0}</div>
              <div class="mt-4 flex items-center">
                <span class="text-sm text-neutral-500 mr-2">Active:</span>
                <span class="font-medium">{stats?.products.active || 0}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div class="p-4">
              <h3 class="text-sm font-medium text-neutral-500 mb-1">
                Total Sales
              </h3>
              <div class="text-2xl font-bold">
                {stats?.sales.totalCount || 0}
              </div>
              <div class="mt-4 flex items-center">
                <span class="text-sm text-neutral-500 mr-2">This month:</span>
                <span class="font-medium">{stats?.sales.currentMonth || 0}</span
                >
                {#if stats?.sales.monthlySalesChange}
                  <span
                    class={stats.sales.monthlySalesChange > 0
                      ? "text-green-600 ml-2"
                      : "text-red-600 ml-2"}
                  >
                    {stats.sales.monthlySalesChange > 0 ? "+" : ""}{stats.sales
                      .monthlySalesChange}%
                  </span>
                {/if}
              </div>
            </div>
          </Card>

          <Card>
            <div class="p-4">
              <h3 class="text-sm font-medium text-neutral-500 mb-1">
                Customers
              </h3>
              <div class="text-2xl font-bold">
                {stats?.customers.totalCount || 0}
              </div>
              <div class="mt-4 flex items-center">
                <span class="text-sm text-neutral-500 mr-2"
                  >New this month:</span
                >
                <span class="font-medium"
                  >{stats?.customers.newThisMonth || 0}</span
                >
              </div>
            </div>
          </Card>
        </div>

        <!-- Revenue Chart -->
        <Card>
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-medium">Revenue Over Time</h3>
              <div class="flex space-x-2">
                <Button
                  variant={selectedPeriod === "week" ? "primary" : "outline"}
                  size="sm"
                  on:click={() => changePeriod("week")}
                >
                  Week
                </Button>
                <Button
                  variant={selectedPeriod === "month" ? "primary" : "outline"}
                  size="sm"
                  on:click={() => changePeriod("month")}
                >
                  Month
                </Button>
                <Button
                  variant={selectedPeriod === "year" ? "primary" : "outline"}
                  size="sm"
                  on:click={() => changePeriod("year")}
                >
                  Year
                </Button>
              </div>
            </div>

            {#if stats && stats.revenueByDay}
              <Chart
                type="line"
                data={{
                  labels: stats.revenueByDay.map((day) => day.date),
                  datasets: [
                    {
                      label: "Revenue",
                      data: stats.revenueByDay.map((day) => day.amount),
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      borderColor: "rgb(59, 130, 246)",
                      borderWidth: 2,
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return "$" + value;
                        },
                      },
                    },
                  },
                }}
              />
            {:else}
              <div class="h-64 flex items-center justify-center">
                <p class="text-neutral-500">No revenue data available</p>
              </div>
            {/if}
          </div>
        </Card>

        <!-- Top Products & Recent Sales -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-medium mb-4">Top Products</h3>
              {#if stats && stats.topProducts && stats.topProducts.length > 0}
                <div class="space-y-4">
                  {#each stats.topProducts as product}
                    <div class="flex justify-between items-center">
                      <div>
                        <p class="font-medium">{product.name}</p>
                        <p class="text-sm text-neutral-500">
                          {product.sales} sales
                        </p>
                      </div>
                      <div class="text-lg font-medium">
                        {formatCurrency(product.revenue)}
                      </div>
                    </div>
                  {/each}
                </div>

                <div class="mt-4 text-center">
                  <Button variant="ghost" size="sm" href="/creators/products">
                    View All Products
                  </Button>
                </div>
              {:else}
                <div class="text-center py-8">
                  <p class="text-neutral-500">No product data available</p>
                </div>
              {/if}
            </div>
          </Card>

          <Card>
            <div class="p-6">
              <h3 class="text-lg font-medium mb-4">Recent Earnings</h3>
              {#if earnings && earnings.length > 0}
                <div class="space-y-4">
                  {#each earnings.slice(0, 5) as earning}
                    <div class="flex justify-between items-center">
                      <div>
                        <p class="font-medium">
                          {earning.source === "product_sale"
                            ? "Product Sale"
                            : earning.source === "tip"
                              ? "Customer Tip"
                              : earning.source === "subscription"
                                ? "Subscription"
                                : earning.source === "sponsorship"
                                  ? "Sponsorship"
                                  : "Affiliate Commission"}
                        </p>
                        <p class="text-sm text-neutral-500">
                          {earning.sourceName || ""}
                        </p>
                        <p class="text-xs text-neutral-500">
                          {formatDate(earning.createdAt)}
                        </p>
                      </div>
                      <div class="text-lg font-medium">
                        {formatCurrency(earning.amount)}
                      </div>
                    </div>
                  {/each}
                </div>

                <div class="mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    on:click={() => (activeTab = "earnings")}
                  >
                    View All Earnings
                  </Button>
                </div>
              {:else}
                <div class="text-center py-8">
                  <p class="text-neutral-500">No earnings data available</p>
                </div>
              {/if}
            </div>
          </Card>
        </div>

        <!-- Quick Actions -->
        <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6">
          <h3 class="text-lg font-medium mb-4">Quick Actions</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              href="/creators/products/new"
              variant="primary"
              class="justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Product
            </Button>

            <Button
              href="/creators/payouts/request"
              variant="outline"
              class="justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Request Payout
            </Button>

            <Button
              href="/creators/affiliate"
              variant="outline"
              class="justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Generate Affiliate Link
            </Button>

            <Button
              href="/creators/settings"
              variant="outline"
              class="justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Update Settings
            </Button>
          </div>
        </div>
      </div>

      <!-- Products Tab -->
    {:else if activeTab === "products"}
      <div class="mt-6">
        <Card>
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-medium">Your Products</h3>
              <Button variant="primary" href="/creators/products/new">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Product
              </Button>
            </div>

            {#if products && products.length > 0}
              <DataTable
                data={products}
                columns={[
                  {
                    key: "name",
                    title: "Product",
                    sortable: true,
                    format: (value, row) => `
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 mr-3 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          ${
                            row.previewImages && row.previewImages.length > 0
                              ? `<img src="${row.previewImages[0].thumbnailUrl}" alt="${value}" class="h-full w-full object-cover">`
                              : ""
                          }
                        </div>
                        <div>
                          <div class="font-medium">${value}</div>
                          <div class="text-xs text-neutral-500">
                            ${row.category ? row.category.name : ""}
                          </div>
                        </div>
                      </div>
                    `,
                  },
                  {
                    key: "price",
                    title: "Price",
                    align: "right",
                    sortable: true,
                    format: (value) => formatCurrency(value),
                  },
                  {
                    key: "salesCount",
                    title: "Sales",
                    align: "right",
                    sortable: true,
                  },
                  {
                    key: "rating",
                    title: "Rating",
                    align: "right",
                    sortable: true,
                    format: (value, row) => `
                      <div class="flex items-center justify-end">
                        <span>${value.toFixed(1)}</span>
                        <span class="ml-1 text-yellow-500">★</span>
                        <span class="ml-1 text-xs text-neutral-500">(${row.reviewCount})</span>
                      </div>
                    `,
                  },
                  {
                    key: "status",
                    title: "Status",
                    sortable: true,
                    format: (value) => {
                      const statusClasses = {
                        draft:
                          "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
                        pending:
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                        approved:
                          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                        rejected:
                          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                      };
                      const statusClass =
                        statusClasses[value] || statusClasses.draft;
                      return `
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                          ${value.charAt(0).toUpperCase() + value.slice(1)}
                        </span>
                      `;
                    },
                  },
                  {
                    key: "actions",
                    title: "",
                    align: "right",
                    format: (_, row) => `
                      <div class="flex justify-end space-x-2">
                        <a href="/creators/products/${row.id}/edit" class="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
                          Edit
                        </a>
                        <a href="/marketplace/products/${row.slug}" class="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-800">
                          View
                        </a>
                      </div>
                    `,
                  },
                ]}
                pagination={true}
              />
            {:else}
              <div
                class="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mx-auto h-12 w-12 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3 class="mt-2 text-lg font-medium">No products yet</h3>
                <p class="mt-1 text-neutral-500 dark:text-neutral-400">
                  Get started by creating your first product to sell on the
                  marketplace.
                </p>
                <div class="mt-6">
                  <Button variant="primary" href="/creators/products/new">
                    Create Product
                  </Button>
                </div>
              </div>
            {/if}
          </div>
        </Card>
      </div>

      <!-- Earnings Tab -->
    {:else if activeTab === "earnings"}
      <div class="mt-6 space-y-6">
        <!-- Balance Card -->
        <Card>
          <div class="p-6">
            <div
              class="flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div class="mb-4 md:mb-0">
                <h3 class="text-lg font-medium">Current Balance</h3>
                <div class="text-3xl font-bold mt-2">
                  {formatCurrency(profile?.balance || 0)}
                </div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Funds are available for withdrawal after a 7-day holding
                  period.
                </p>
              </div>

              <div>
                <Button
                  variant="primary"
                  href="/creators/payouts/request"
                  disabled={!profile?.balance || profile.balance <= 0}
                >
                  Request Payout
                </Button>
                <p
                  class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center"
                >
                  Minimum payout: {formatCurrency(25)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <!-- Earnings Table -->
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-medium mb-6">Earnings History</h3>

            {#if earnings && earnings.length > 0}
              <DataTable
                data={earnings}
                columns={[
                  {
                    key: "createdAt",
                    title: "Date",
                    sortable: true,
                    format: (value) => formatDate(value),
                  },
                  {
                    key: "source",
                    title: "Source",
                    sortable: true,
                    format: (value, row) => `
                      <div>
                        <div>
                          ${
                            value === "product_sale"
                              ? "Product Sale"
                              : value === "tip"
                                ? "Customer Tip"
                                : value === "subscription"
                                  ? "Subscription"
                                  : value === "sponsorship"
                                    ? "Sponsorship"
                                    : "Affiliate Commission"
                          }
                        </div>
                        ${row.sourceName ? `<div class="text-xs text-neutral-500">${row.sourceName}</div>` : ""}
                      </div>
                    `,
                  },
                  {
                    key: "amount",
                    title: "Amount",
                    align: "right",
                    sortable: true,
                    format: (value) => formatCurrency(value),
                  },
                  {
                    key: "status",
                    title: "Status",
                    sortable: true,
                    format: (value) => {
                      const statusClasses = {
                        pending:
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                        available:
                          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                        processing:
                          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                        paid: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
                        cancelled:
                          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                      };
                      const statusClass =
                        statusClasses[value] || statusClasses.pending;
                      return `
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
                          ${value.charAt(0).toUpperCase() + value.slice(1)}
                        </span>
                      `;
                    },
                  },
                ]}
                pagination={true}
              />
            {:else}
              <div
                class="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mx-auto h-12 w-12 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 class="mt-2 text-lg font-medium">No earnings yet</h3>
                <p class="mt-1 text-neutral-500 dark:text-neutral-400">
                  Once you start selling products, your earnings will appear
                  here.
                </p>
              </div>
            {/if}
          </div>
        </Card>

        <!-- Payout Methods -->
        <Card>
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-medium">Payout Methods</h3>
              <Button variant="outline" href="/creators/payout-methods/new">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Method
              </Button>
            </div>

            {#if profile?.payoutMethods && profile.payoutMethods.length > 0}
              <div class="space-y-4">
                {#each profile.payoutMethods as method}
                  <div
                    class="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                  >
                    <div class="flex items-center">
                      <div
                        class="mr-3 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full"
                      >
                        {#if method.type === "paypal"}
                          <svg
                            class="h-6 w-6 text-blue-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              d="M19.554 9.488c.121.563.106 1.246-.04 2.051-.582 2.978-2.477 4.466-5.683 4.466h-.442a.666.666 0 00-.444.166.669.669 0 00-.212.427l-.04.21-.63 4.028-.024.15a.672.672 0 01-.21.428.667.667 0 01-.445.167h-2.47a.555.555 0 01-.55-.653l.033-.176.565-3.587.037-.191a.673.673 0 01.211-.429.667.667 0 01.445-.167h1.512c2.188 0 3.917-.447 5.194-1.377a5.026 5.026 0 001.307-1.058 4.41 4.41 0 00.713-1.146c.292-.628.452-1.33.512-2.032a3.49 3.49 0 00-.161-1.472 3.871 3.871 0 00-.886-1.177 3.586 3.586 0 00-1.134-.766z"
                            />
                            <path
                              d="M18.373 5.027a5.192 5.192 0 00-1.318-1.058c-1.276-.93-3.007-1.376-5.195-1.376H7.837a.67.67 0 00-.656.593L5.452 16.533a.556.556 0 00.55.653h2.504l.63-3.998.04-.217a.669.669 0 01.657-.593h1.371c2.188 0 3.917-.446 5.194-1.376.685-.5 1.115-.911 1.438-1.538.322-.628.493-1.283.493-2.032 0-1.259-.431-2.149-1.159-2.742a3.176 3.176 0 00-.797-.663z"
                            />
                          </svg>
                        {:else if method.type === "bank"}
                          <svg
                            class="h-6 w-6 text-green-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                            />
                          </svg>
                        {:else if method.type === "stripe"}
                          <svg
                            class="h-6 w-6 text-purple-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              d="M13.479 9.883c-1.626-.604-2.512-.931-2.512-1.503 0-.523.414-.813 1.157-.813 1.322 0 2.667.501 3.71 1.057l.564-2.43c-.738-.394-2.292-1.032-4.254-1.032-1.436 0-2.632.394-3.482 1.145-.867.762-1.322 1.852-1.322 3.154 0 2.386 1.435 3.405 3.68 4.188 1.474.499 1.968.867 1.968 1.435 0 .564-.489.906-1.371.906-1.175 0-3.094-.576-4.331-1.345l-.6 2.457c1.04.576 2.895 1.172 4.87 1.172 1.511 0 2.762-.357 3.622-1.076.979-.774 1.474-1.928 1.474-3.365 0-2.424-1.474-3.431-3.673-4.22z"
                            />
                          </svg>
                        {/if}
                      </div>

                      <div>
                        <p class="font-medium">
                          {method.type === "paypal"
                            ? "PayPal"
                            : method.type === "bank"
                              ? "Bank Account"
                              : "Stripe Account"}
                          {#if method.isDefault}
                            <span
                              class="ml-2 text-xs py-1 px-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full"
                            >
                              Default
                            </span>
                          {/if}
                        </p>

                        {#if method.type === "paypal"}
                          <p
                            class="text-sm text-neutral-500 dark:text-neutral-400"
                          >
                            {method.details.email}
                          </p>
                        {:else if method.type === "bank"}
                          <p
                            class="text-sm text-neutral-500 dark:text-neutral-400"
                          >
                            {method.details.bankName} •••• {method.details.accountNumber.slice(
                              -4,
                            )}
                          </p>
                        {:else}
                          <p
                            class="text-sm text-neutral-500 dark:text-neutral-400"
                          >
                            Connected account
                          </p>
                        {/if}
                      </div>
                    </div>

                    <div class="flex space-x-2">
                      {#if !method.isDefault}
                        <Button variant="ghost" size="sm">Set Default</Button>
                      {/if}
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div
                class="text-center py-8 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mx-auto h-12 w-12 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <h3 class="mt-2 text-lg font-medium">No payout methods</h3>
                <p class="mt-1 text-neutral-500 dark:text-neutral-400">
                  Add a payout method to receive your earnings.
                </p>
                <div class="mt-6">
                  <Button variant="primary" href="/creators/payout-methods/new">
                    Add Payout Method
                  </Button>
                </div>
              </div>
            {/if}
          </div>
        </Card>
      </div>

      <!-- Analytics Tab -->
    {:else if activeTab === "analytics"}
      <div class="mt-6">
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-medium mb-6">Performance Analytics</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Conversion Rate Chart -->
              <div>
                <h4 class="text-sm font-medium mb-3">Conversion Rate</h4>
                <Chart
                  type="line"
                  data={{
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [
                      {
                        label: "Views to Sales %",
                        data: [2.3, 2.8, 3.2, 2.9, 3.8, 4.2],
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        borderColor: "rgb(16, 185, 129)",
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function (value) {
                            return value + "%";
                          },
                        },
                      },
                    },
                  }}
                />
              </div>

              <!-- Sales by Category -->
              <div>
                <h4 class="text-sm font-medium mb-3">Sales by Category</h4>
                <Chart
                  type="doughnut"
                  data={{
                    labels: [
                      "Templates",
                      "Icons",
                      "UI Kits",
                      "Plugins",
                      "Other",
                    ],
                    datasets: [
                      {
                        data: [45, 23, 18, 10, 4],
                        backgroundColor: [
                          "rgba(59, 130, 246, 0.7)",
                          "rgba(16, 185, 129, 0.7)",
                          "rgba(245, 158, 11, 0.7)",
                          "rgba(139, 92, 246, 0.7)",
                          "rgba(75, 85, 99, 0.7)",
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div
              class="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700"
            >
              <h4 class="text-sm font-medium mb-3">Product Performance</h4>

              <DataTable
                data={products.slice(0, 5)}
                columns={[
                  { key: "name", title: "Product", sortable: true },
                  {
                    key: "views",
                    title: "Views",
                    align: "right",
                    sortable: true,
                    format: () => Math.floor(Math.random() * 1000) + 100,
                  },
                  {
                    key: "conversion",
                    title: "Conversion",
                    align: "right",
                    sortable: true,
                    format: () => (Math.random() * 5 + 1).toFixed(1) + "%",
                  },
                  {
                    key: "salesCount",
                    title: "Sales",
                    align: "right",
                    sortable: true,
                  },
                  {
                    key: "revenue",
                    title: "Revenue",
                    align: "right",
                    sortable: true,
                    format: (_, row) =>
                      formatCurrency(row.price * row.salesCount),
                  },
                ]}
              />

              <div class="mt-4 text-center">
                <Button variant="outline" href="/creators/analytics">
                  View Detailed Analytics
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Settings Tab -->
    {:else if activeTab === "settings"}
      <div class="mt-6">
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-medium mb-6">Creator Profile Settings</h3>

            <div class="space-y-6">
              <!-- Profile Details -->
              <div>
                <h4 class="text-sm font-medium mb-4">Basic Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.displayName}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Expertise
                    </label>
                    <input
                      type="text"
                      value={profile.expertise.join(", ")}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>
                </div>

                <div class="mt-4">
                  <label
                    class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                  >
                    Bio
                  </label>
                  <textarea
                    rows="4"
                    class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    >{profile.bio}</textarea
                  >
                </div>
              </div>

              <!-- Social Links -->
              <div
                class="pt-6 border-t border-neutral-200 dark:border-neutral-700"
              >
                <h4 class="text-sm font-medium mb-4">Social Links</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Website
                    </label>
                    <input
                      type="text"
                      value={profile.websiteUrl || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={profile.socialLinks?.twitter || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={profile.socialLinks?.instagram || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={profile.socialLinks?.linkedin || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>
                </div>
              </div>

              <!-- Tax Info -->
              <div
                class="pt-6 border-t border-neutral-200 dark:border-neutral-700"
              >
                <h4 class="text-sm font-medium mb-4">Tax Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      value={profile.taxInfo?.country || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={profile.taxInfo?.taxId || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={profile.taxInfo?.companyName || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      VAT Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={profile.taxInfo?.vatNumber || ""}
                      class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800"
                    />
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div
                class="pt-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end"
              >
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    {/if}
  {/if}
</div>
