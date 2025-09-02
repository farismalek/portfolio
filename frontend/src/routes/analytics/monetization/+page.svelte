<script lang="ts">
  import { onMount } from "svelte";
  import { subDays } from "date-fns";
  import { analyticsStore } from "$lib/stores/analyticsStore";
  import {
    trackEvent,
    EventCategory,
    EventType,
  } from "$lib/services/analyticsService";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import DateRangePicker from "$lib/components/analytics/DateRangePicker.svelte";
  import KpiCard from "$lib/components/analytics/KpiCard.svelte";
  import AnalyticsWidget from "$lib/components/analytics/AnalyticsWidget.svelte";
  import Chart from "$lib/components/analytics/Chart.svelte";
  import DataTable from "$lib/components/analytics/DataTable.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Card from "$lib/components/common/Card.svelte";

  // Date range state
  let startDate = subDays(new Date(), 30);
  let endDate = new Date();

  // Loading states
  let isLoading = true;
  let error: string | null = null;

  // Chart data
  let revenueChartData = {
    labels: [],
    datasets: [
      {
        label: "Total Revenue",
        data: [],
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Subscription Revenue",
        data: [],
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Product Sales",
        data: [],
        borderColor: "rgb(139, 92, 246)",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  let revenueByProductData = {
    labels: [
      "Premium Template",
      "Consulting",
      "Digital Products",
      "Sponsors",
      "Affiliates",
    ],
    datasets: [
      {
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(236, 72, 153, 0.7)",
        ],
      },
    ],
  };

  let subscriberGrowthData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    datasets: [
      {
        label: "Subscribers",
        data: [24, 32, 45, 57, 64, 78, 86, 95, 112],
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        borderColor: "rgb(139, 92, 246)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Table data
  let transactionData = [];
  let productData = [];

  onMount(() => {
    // Track this page view
    trackEvent(EventCategory.SYSTEM, EventType.PAGE_VIEW, {
      page: "monetization-analytics",
    });

    loadMonetizationAnalytics();
  });

  async function loadMonetizationAnalytics() {
    isLoading = true;
    error = null;

    try {
      const dateRange = { startDate, endDate };

      // Load monetization stats
      const monetizationStats =
        await analyticsStore.fetchMonetizationStats(dateRange);

      // Update chart data
      updateChartData(monetizationStats);

      // Generate mock data for tables
      generateMockTableData();
    } catch (err) {
      error = err.message || "Failed to load monetization analytics";
      console.error("Analytics error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Handle date range change
  function handleDateRangeChange(event) {
    startDate = event.detail.startDate;
    endDate = event.detail.endDate;
    loadMonetizationAnalytics();
  }

  // Update chart data based on loaded stats
  function updateChartData(stats) {
    if (stats?.transactionsByDate) {
      // Generate labels from dates
      const labels = stats.transactionsByDate.map((item) => item.date);

      // Extract data series
      const totalRevenue = stats.transactionsByDate.map((item) => item.amount);

      // Split into subscription and product revenue (mocked for demonstration)
      const subscriptionRevenue = totalRevenue.map((val) => val * 0.6); // 60% from subscriptions
      const productRevenue = totalRevenue.map((val) => val * 0.4); // 40% from products

      revenueChartData = {
        ...revenueChartData,
        labels,
        datasets: [
          {
            ...revenueChartData.datasets[0],
            data: totalRevenue,
          },
          {
            ...revenueChartData.datasets[1],
            data: subscriptionRevenue,
          },
          {
            ...revenueChartData.datasets[2],
            data: productRevenue,
          },
        ],
      };
    }

    if (stats?.revenueByProduct) {
      revenueByProductData = {
        ...revenueByProductData,
        labels: stats.revenueByProduct.map((item) => item.product),
        datasets: [
          {
            ...revenueByProductData.datasets[0],
            data: stats.revenueByProduct.map((item) => item.revenue),
          },
        ],
      };
    }
  }

  // Generate mock table data for demonstration
  function generateMockTableData() {
    // Transaction data
    transactionData = [
      {
        id: "txn-001",
        date: "2025-09-01",
        customer: "Sarah Johnson",
        product: "Professional Portfolio Template Bundle",
        amount: 49.99,
        status: "completed",
      },
      {
        id: "txn-002",
        date: "2025-09-01",
        customer: "Michael Chen",
        product: "Monthly Subscription - Pro Plan",
        amount: 19.99,
        status: "completed",
      },
      {
        id: "txn-003",
        date: "2025-08-30",
        customer: "Jessica Williams",
        product: "UX Design Process Guide",
        amount: 29.99,
        status: "completed",
      },
      {
        id: "txn-004",
        date: "2025-08-29",
        customer: "Thomas Parker",
        product: "Monthly Subscription - Pro Plan",
        amount: 19.99,
        status: "completed",
      },
      {
        id: "txn-005",
        date: "2025-08-28",
        customer: "Amanda Lee",
        product: "Frontend Development Masterclass",
        amount: 79.99,
        status: "completed",
      },
      {
        id: "txn-006",
        date: "2025-08-27",
        customer: "Robert Garcia",
        product: "Monthly Subscription - Basic Plan",
        amount: 9.99,
        status: "completed",
      },
      {
        id: "txn-007",
        date: "2025-08-26",
        customer: "Emily Davis",
        product: "Resume Templates Pack",
        amount: 19.99,
        status: "completed",
      },
    ];

    // Product data
    productData = [
      {
        id: 1,
        product: "Professional Portfolio Template Bundle",
        price: 49.99,
        sales: 42,
        revenue: 2099.58,
        rating: 4.8,
      },
      {
        id: 2,
        product: "UX Design Process Guide",
        price: 29.99,
        sales: 38,
        revenue: 1139.62,
        rating: 4.7,
      },
      {
        id: 3,
        product: "Frontend Development Masterclass",
        price: 79.99,
        sales: 27,
        revenue: 2159.73,
        rating: 4.9,
      },
      {
        id: 4,
        product: "Resume Templates Pack",
        price: 19.99,
        sales: 56,
        revenue: 1119.44,
        rating: 4.5,
      },
      {
        id: 5,
        product: "Personal Branding Guide",
        price: 24.99,
        sales: 31,
        revenue: 774.69,
        rating: 4.6,
      },
    ];
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  }
</script>

<svelte:head>
  <title>Monetization Analytics | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Monetization Analytics"
    description="Track your revenue and subscription metrics"
  >
    <div class="flex items-center space-x-2">
      <DateRangePicker
        bind:startDate
        bind:endDate
        on:change={handleDateRangeChange}
      />
      <Button variant="outline" size="sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export
      </Button>
    </div>
  </PageHeader>

  <!-- KPI Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <KpiCard
      title="Total Revenue"
      value={$analyticsStore.monetizationStats?.totalRevenue || 0}
      previousValue={4580}
      percentChange={14.2}
      format="currency"
      color="success"
      loading={isLoading}
    />

    <KpiCard
      title="Subscription Revenue"
      value={$analyticsStore.monetizationStats?.subscriptionRevenue || 0}
      previousValue={2760}
      percentChange={12.7}
      format="currency"
      color="primary"
      loading={isLoading}
    />

    <KpiCard
      title="Product Sales"
      value={$analyticsStore.monetizationStats?.productSales || 0}
      previousValue={1820}
      percentChange={16.5}
      format="currency"
      color="secondary"
      loading={isLoading}
    />

    <KpiCard
      title="Avg. Customer Value"
      value={$analyticsStore.monetizationStats?.customerLifetimeValue || 0}
      previousValue={138}
      percentChange={8.7}
      format="currency"
      color="info"
      loading={isLoading}
    />
  </div>

  <!-- Revenue Chart -->
  <AnalyticsWidget
    title="Revenue Over Time"
    description="Monthly revenue breakdown"
    loading={isLoading}
    fullWidth={true}
  >
    <Chart
      type="line"
      data={revenueChartData}
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
  </AnalyticsWidget>

  <!-- Two Columns Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <!-- Revenue by Product -->
    <AnalyticsWidget
      title="Revenue by Product"
      description="Which products are generating revenue"
      loading={isLoading}
    >
      <Chart
        type="pie"
        data={revenueByProductData}
        options={{
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${percentage}% ($${value})`;
                },
              },
            },
          },
        }}
      />
    </AnalyticsWidget>

    <!-- Subscriber Growth -->
    <AnalyticsWidget
      title="Subscriber Growth"
      description="Growth in paying subscribers"
      loading={isLoading}
    >
      <Chart
        type="line"
        data={subscriberGrowthData}
        options={{
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
    </AnalyticsWidget>
  </div>

  <!-- Top Products -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Top Selling Products"
      description="Your best performing digital products"
      loading={isLoading}
      fullWidth={true}
    >
      <DataTable
        data={productData}
        columns={[
          { key: "product", title: "Product", sortable: true },
          {
            key: "price",
            title: "Price",
            align: "right",
            format: (value) => formatCurrency(value),
            sortable: true,
          },
          {
            key: "sales",
            title: "Sales",
            align: "right",
            sortable: true,
          },
          {
            key: "revenue",
            title: "Revenue",
            align: "right",
            format: (value) => formatCurrency(value),
            sortable: true,
          },
          {
            key: "rating",
            title: "Rating",
            align: "right",
            format: (value) => {
              return `<div class="flex items-center justify-end">
                <span class="mr-1">${value}</span>
                <span class="text-yellow-500">★</span>
              </div>`;
            },
            sortable: true,
          },
          {
            key: "actions",
            title: "",
            align: "right",
            format: () => `
              <button class="text-xs px-3 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                View Details
              </button>
            `,
          },
        ]}
      />
    </AnalyticsWidget>
  </div>

  <!-- Recent Transactions -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Recent Transactions"
      description="Latest purchases and subscriptions"
      loading={isLoading}
      fullWidth={true}
    >
      <DataTable
        data={transactionData}
        columns={[
          {
            key: "id",
            title: "Transaction ID",
            sortable: true,
            format: (value) =>
              `<span class="font-mono text-xs">${value}</span>`,
          },
          {
            key: "date",
            title: "Date",
            sortable: true,
          },
          {
            key: "customer",
            title: "Customer",
            sortable: true,
          },
          {
            key: "product",
            title: "Product",
            sortable: true,
          },
          {
            key: "amount",
            title: "Amount",
            align: "right",
            format: (value) => formatCurrency(value),
            sortable: true,
          },
          {
            key: "status",
            title: "Status",
            format: (value) => {
              const colors = {
                completed:
                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                pending:
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                failed:
                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                refunded:
                  "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
              };
              return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colors[value] || ""}">${value.charAt(0).toUpperCase() + value.slice(1)}</span>`;
            },
          },
        ]}
        pagination={true}
      />
    </AnalyticsWidget>
  </div>

  <!-- Subscription Metrics -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Subscription Metrics"
      description="Key metrics for your subscription business"
      loading={isLoading}
      fullWidth={true}
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div class="p-4">
            <h3 class="text-sm font-medium text-neutral-500 mb-1">
              Monthly Recurring Revenue
            </h3>
            <div class="text-2xl font-bold">{formatCurrency(2860)}</div>
            <div class="mt-4 flex items-center">
              <span class="text-sm text-green-600 mr-2">↑ 8.5%</span>
              <span class="text-xs text-neutral-500">vs. last month</span>
            </div>
          </div>
        </Card>

        <Card>
          <div class="p-4">
            <h3 class="text-sm font-medium text-neutral-500 mb-1">
              Retention Rate
            </h3>
            <div class="text-2xl font-bold">92.4%</div>
            <div class="mt-4 flex items-center">
              <span class="text-sm text-green-600 mr-2">↑ 2.1%</span>
              <span class="text-xs text-neutral-500">vs. last month</span>
            </div>
          </div>
        </Card>

        <Card>
          <div class="p-4">
            <h3 class="text-sm font-medium text-neutral-500 mb-1">
              Churn Rate
            </h3>
            <div class="text-2xl font-bold">7.6%</div>
            <div class="mt-4 flex items-center">
              <span class="text-sm text-red-600 mr-2">↑ 0.8%</span>
              <span class="text-xs text-neutral-500">vs. last month</span>
            </div>
          </div>
        </Card>
      </div>

      <div class="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
        <h3 class="text-lg font-medium mb-4">Subscription Plan Distribution</h3>
        <div class="relative pt-1">
          <div class="flex mb-2 items-center justify-between">
            <div>
              <span
                class="text-xs font-medium inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200"
              >
                Basic Plan
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium inline-block">
                32% (68 subscribers)
              </span>
            </div>
          </div>
          <div
            class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200"
          >
            <div
              style="width:32%"
              class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
            ></div>
          </div>

          <div class="flex mb-2 items-center justify-between">
            <div>
              <span
                class="text-xs font-medium inline-block py-1 px-2 uppercase rounded-full text-secondary-600 bg-secondary-200"
              >
                Pro Plan
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium inline-block">
                48% (102 subscribers)
              </span>
            </div>
          </div>
          <div
            class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-secondary-200"
          >
            <div
              style="width:48%"
              class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary-500"
            ></div>
          </div>

          <div class="flex mb-2 items-center justify-between">
            <div>
              <span
                class="text-xs font-medium inline-block py-1 px-2 uppercase rounded-full text-accent-600 bg-accent-200"
              >
                Enterprise Plan
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium inline-block">
                20% (42 subscribers)
              </span>
            </div>
          </div>
          <div
            class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-accent-200"
          >
            <div
              style="width:20%"
              class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-500"
            ></div>
          </div>
        </div>
      </div>
    </AnalyticsWidget>
  </div>

  <!-- Revenue Opportunities -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Revenue Opportunities"
      description="AI-powered insights to increase your revenue"
      loading={isLoading}
      fullWidth={true}
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div
                class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Upgrade Opportunity</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  32 Basic subscribers are highly engaged. Target them with a
                  Pro upgrade offer to increase revenue by $640/month.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card
          class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div
                class="flex-shrink-0 h-10 w-10 rounded-full bg-purple-200 dark:bg-purple-700 flex items-center justify-center text-purple-600 dark:text-purple-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Bundle Opportunity</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Create a bundle with your top 3 products to increase average
                  order value by an estimated 24%.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Create Bundle
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card
          class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div
                class="flex-shrink-0 h-10 w-10 rounded-full bg-green-200 dark:bg-green-700 flex items-center justify-center text-green-600 dark:text-green-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Churn Prevention</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  12 subscribers show decreased engagement. Reach out with a
                  retention offer to prevent $240/month in lost revenue.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Create Retention Offer
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div class="mt-4 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
        <div class="flex items-center">
          <div
            class="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-200 dark:bg-yellow-700 flex items-center justify-center text-yellow-600 dark:text-yellow-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
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
          </div>
          <div class="ml-4">
            <h4 class="text-sm font-medium">Pricing Optimization</h4>
            <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Based on customer purchasing patterns and competitor analysis,
              increasing your Pro plan by $2/month would increase revenue
              without affecting conversion rates. This could generate an
              additional $204/month.
            </p>
            <div class="mt-2 flex space-x-2">
              <button
                class="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Run Price Test
              </button>
              <button
                class="text-xs px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600"
              >
                View Detailed Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsWidget>
  </div>
</div>
