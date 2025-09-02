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
  import Dropdown from "$lib/components/common/Dropdown.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";

  // Portfolio selection
  let selectedPortfolio = {
    id: "current",
    name: "Main Portfolio",
  };

  const portfolios = [
    { id: "current", name: "Main Portfolio" },
    { id: "portfolio-2", name: "Developer Portfolio" },
    { id: "portfolio-3", name: "Design Portfolio" },
  ];

  // Date range state
  let startDate = subDays(new Date(), 30);
  let endDate = new Date();

  // Loading states
  let isLoading = true;
  let error: string | null = null;

  // Chart data
  let viewsChartData = {
    labels: [],
    datasets: [
      {
        label: "Views",
        data: [],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Table data
  let visitorData = [];
  let referrerData = [];
  let sectionPerformance = [];

  onMount(() => {
    // Track this page view
    trackEvent(EventCategory.SYSTEM, EventType.PAGE_VIEW, {
      page: "portfolio-analytics",
    });

    loadPortfolioAnalytics();
  });

  async function loadPortfolioAnalytics() {
    isLoading = true;
    error = null;

    try {
      const dateRange = { startDate, endDate };

      // Load portfolio stats
      const portfolioStats = await analyticsStore.fetchPortfolioStats(
        selectedPortfolio.id,
        dateRange,
      );

      // Update chart data
      updateChartData(portfolioStats);

      // Generate mock data for tables
      generateMockTableData();
    } catch (err) {
      error = err.message || "Failed to load portfolio analytics";
      console.error("Analytics error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Handle date range change
  function handleDateRangeChange(event) {
    startDate = event.detail.startDate;
    endDate = event.detail.endDate;
    loadPortfolioAnalytics();
  }

  function handlePortfolioChange(portfolio) {
    selectedPortfolio = portfolio;
    loadPortfolioAnalytics();
  }

  // Update chart data based on loaded stats
  function updateChartData(stats) {
    if (stats?.viewsByDate) {
      viewsChartData = {
        ...viewsChartData,
        labels: stats.viewsByDate.map((item) => item.date),
        datasets: [
          {
            ...viewsChartData.datasets[0],
            data: stats.viewsByDate.map((item) => item.count),
          },
        ],
      };
    }
  }

  // Generate mock table data for demonstration
  function generateMockTableData() {
    // Visitor data
    visitorData = [
      {
        id: "1",
        name: "Sarah Johnson",
        company: "Tech Innovations Inc.",
        position: "CTO",
        location: "San Francisco, CA",
        viewedAt: "2025-09-01T14:23:00Z",
        viewDuration: 245,
      },
      {
        id: "2",
        name: "Michael Chen",
        company: "Digital Solutions Ltd",
        position: "Lead Developer",
        location: "New York, NY",
        viewedAt: "2025-09-01T12:05:00Z",
        viewDuration: 192,
      },
      {
        id: "3",
        name: "Jessica Williams",
        company: "Creative Agency Group",
        position: "Design Director",
        location: "London, UK",
        viewedAt: "2025-08-31T20:47:00Z",
        viewDuration: 318,
      },
      {
        id: "4",
        name: "Thomas Parker",
        company: "Enterprise Software Co",
        position: "HR Manager",
        location: "Chicago, IL",
        viewedAt: "2025-08-31T17:12:00Z",
        viewDuration: 87,
      },
      {
        id: "5",
        name: "Amanda Lee",
        company: "StartUp Ventures",
        position: "CEO",
        location: "Austin, TX",
        viewedAt: "2025-08-30T09:34:00Z",
        viewDuration: 412,
      },
      {
        id: "6",
        name: "Robert Garcia",
        company: "TechHub Accelerator",
        position: "Investment Partner",
        location: "Boston, MA",
        viewedAt: "2025-08-29T15:42:00Z",
        viewDuration: 276,
      },
      {
        id: "7",
        name: "Emily Davis",
        company: "Global Tech Solutions",
        position: "Talent Acquisition",
        location: "Seattle, WA",
        viewedAt: "2025-08-28T08:11:00Z",
        viewDuration: 143,
      },
    ];

    // Referrer data
    referrerData = [
      { source: "linkedin.com", count: 142, percentage: 34.5 },
      { source: "google.com", count: 89, percentage: 21.6 },
      { source: "github.com", count: 76, percentage: 18.4 },
      { source: "twitter.com", count: 52, percentage: 12.6 },
      { source: "portfolia.com", count: 31, percentage: 7.5 },
      { source: "stackoverflow.com", count: 18, percentage: 4.4 },
      { source: "dev.to", count: 4, percentage: 1.0 },
    ];

    // Section performance
    sectionPerformance = [
      { section: "Introduction", views: 412, timeSpent: 45, bounceRate: 12 },
      { section: "Work Experience", views: 387, timeSpent: 120, bounceRate: 8 },
      { section: "Projects", views: 356, timeSpent: 185, bounceRate: 5 },
      {
        section: "Skills & Expertise",
        views: 298,
        timeSpent: 72,
        bounceRate: 15,
      },
      { section: "Education", views: 245, timeSpent: 43, bounceRate: 22 },
      { section: "Testimonials", views: 212, timeSpent: 58, bounceRate: 14 },
      {
        section: "Contact Information",
        views: 176,
        timeSpent: 37,
        bounceRate: 18,
      },
    ];
  }

  // Format seconds to mm:ss
  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
</script>

<svelte:head>
  <title>Portfolio Analytics | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Portfolio Analytics"
    description="Detailed analytics for your portfolios"
  >
    <div class="flex flex-wrap gap-3">
      <Dropdown let:close>
        <button
          slot="trigger"
          class="inline-flex items-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
        >
          <span>{selectedPortfolio.name}</span>
          <svg
            class="ml-2 -mr-1 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <div slot="content" class="py-1">
          {#each portfolios as portfolio}
            <button
              class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              on:click={() => {
                handlePortfolioChange(portfolio);
                close();
              }}
            >
              {portfolio.name}
            </button>
          {/each}
        </div>
      </Dropdown>

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
      title="Total Views"
      value={$analyticsStore.portfolioStats?.totalViews || 0}
      previousValue={354}
      percentChange={8.2}
      color="primary"
      loading={isLoading}
    />

    <KpiCard
      title="Unique Visitors"
      value={$analyticsStore.portfolioStats?.uniqueVisitors || 0}
      previousValue={217}
      percentChange={5.7}
      color="secondary"
      loading={isLoading}
    />

    <KpiCard
      title="Avg. Time on Page"
      value={$analyticsStore.portfolioStats?.averageTimeOnPage || 0}
      previousValue={176}
      percentChange={12.4}
      format="time"
      color="info"
      loading={isLoading}
    />

    <KpiCard
      title="Conversion Rate"
      value={$analyticsStore.portfolioStats?.conversionRate || 0}
      previousValue={3.8}
      percentChange={15.8}
      format="percent"
      color="success"
      loading={isLoading}
    />
  </div>

  <!-- Main Chart -->
  <AnalyticsWidget
    title="Portfolio Views"
    description="Daily views trend for your portfolio"
    loading={isLoading}
    fullWidth={true}
  >
    <Chart
      type="line"
      data={viewsChartData}
      options={{
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Views",
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
        },
      }}
    />
  </AnalyticsWidget>

  <!-- Two columns layout -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <!-- Traffic sources -->
    <AnalyticsWidget
      title="Traffic Sources"
      description="Where your visitors are coming from"
      loading={isLoading}
    >
      <DataTable
        data={referrerData}
        columns={[
          { key: "source", title: "Source", sortable: true },
          { key: "count", title: "Views", align: "right", sortable: true },
          {
            key: "percentage",
            title: "%",
            align: "right",
            format: (value) => `${value}%`,
            sortable: true,
          },
        ]}
      />
    </AnalyticsWidget>

    <!-- Location map -->
    <AnalyticsWidget
      title="Visitor Locations"
      description="Geographic distribution of your visitors"
      loading={isLoading}
    >
      <div
        class="relative h-64 bg-neutral-50 dark:bg-neutral-800 rounded-lg overflow-hidden"
      >
        <!-- Placeholder for a map visualization -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 opacity-50"
        ></div>

        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-center p-4">
            <h3 class="text-lg font-medium mb-2">Geographic Insights</h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Top locations: United States (42%), United Kingdom (12%), Canada
              (8%), Germany (6%), Australia (5%)
            </p>
            <Button variant="outline" size="sm">View Detailed Map</Button>
          </div>
        </div>
      </div>
    </AnalyticsWidget>
  </div>

  <!-- Recent visitors -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Recent Visitors"
      description="People who viewed your portfolio"
      loading={isLoading}
      fullWidth={true}
    >
      <DataTable
        data={visitorData}
        columns={[
          {
            key: "name",
            title: "Visitor",
            sortable: true,
            format: (value, row) => `
              <div class="flex items-center">
                <div class="flex-shrink-0 mr-3">
                  <div class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                    ${value.charAt(0)}
                  </div>
                </div>
                <div>
                  <div class="font-medium">${value}</div>
                  <div class="text-xs text-neutral-500">${row.position} at ${row.company}</div>
                </div>
              </div>
            `,
          },
          { key: "location", title: "Location", sortable: true },
          {
            key: "viewedAt",
            title: "Viewed On",
            sortable: true,
            format: (value) => new Date(value).toLocaleString(),
          },
          {
            key: "viewDuration",
            title: "Time Spent",
            align: "right",
            format: (value) => formatDuration(value),
            sortable: true,
          },
          {
            key: "actions",
            title: "",
            align: "right",
            format: () => `
              <div class="flex justify-end space-x-2">
                <button class="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800">
                  Connect
                </button>
                <button class="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  View
                </button>
              </div>
            `,
          },
        ]}
        pagination={true}
      />
    </AnalyticsWidget>
  </div>

  <!-- Section Performance -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Portfolio Section Performance"
      description="How visitors are engaging with each section"
      loading={isLoading}
      fullWidth={true}
    >
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <Chart
            type="pie"
            data={{
              labels: sectionPerformance.map((item) => item.section),
              datasets: [
                {
                  data: sectionPerformance.map((item) => item.views),
                  backgroundColor: [
                    "rgba(59, 130, 246, 0.7)",
                    "rgba(16, 185, 129, 0.7)",
                    "rgba(245, 158, 11, 0.7)",
                    "rgba(139, 92, 246, 0.7)",
                    "rgba(236, 72, 153, 0.7)",
                    "rgba(14, 165, 233, 0.7)",
                    "rgba(168, 85, 247, 0.7)",
                  ],
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 15,
                    padding: 15,
                    font: {
                      size: 11,
                    },
                  },
                },
              },
            }}
          />
        </div>

        <div class="lg:col-span-2">
          <DataTable
            data={sectionPerformance}
            columns={[
              { key: "section", title: "Section", sortable: true },
              { key: "views", title: "Views", align: "right", sortable: true },
              {
                key: "timeSpent",
                title: "Avg. Time (sec)",
                align: "right",
                sortable: true,
              },
              {
                key: "bounceRate",
                title: "Bounce Rate",
                align: "right",
                format: (value) => `${value}%`,
                sortable: true,
              },
            ]}
          />
        </div>
      </div>
    </AnalyticsWidget>
  </div>

  <!-- Recommendations -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Recommendations"
      description="AI-powered insights to improve your portfolio performance"
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">
                  Increase Work Experience Detail
                </h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Visitors spend 120s on this section. Adding more detail about
                  your role at Tech Innovations could increase engagement.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Apply Suggestion
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Add More Project Details</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Your Projects section has the highest engagement. Consider
                  adding more visuals and technical details.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Apply Suggestion
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Share on LinkedIn</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  LinkedIn is your top referrer. Sharing your updated portfolio
                  there could boost views by 30%.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Share Now
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AnalyticsWidget>
  </div>
</div>
