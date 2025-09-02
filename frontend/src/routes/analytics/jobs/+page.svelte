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
  let startDate = subDays(new Date(), 90); // Default to 90 days for job analytics
  let endDate = new Date();

  // Loading states
  let isLoading = true;
  let error: string | null = null;

  // Chart data
  let applicationFunnelData = {
    labels: ["Submitted", "Viewed", "Interview", "Offer", "Hired"],
    datasets: [
      {
        label: "Applications",
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(236, 72, 153, 0.7)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(139, 92, 246)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 1,
      },
    ],
  };

  let applicationTrendData = {
    labels: [],
    datasets: [
      {
        label: "Applications",
        data: [],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  let responseRateData = {
    labels: [],
    datasets: [
      {
        label: "Applications",
        data: [],
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
      {
        label: "Responses",
        data: [],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
      },
    ],
  };

  // Table data
  let applicationData = [];
  let companyResponseData = [];

  onMount(() => {
    // Track this page view
    trackEvent(EventCategory.SYSTEM, EventType.PAGE_VIEW, {
      page: "job-analytics",
    });

    loadJobAnalytics();
  });

  async function loadJobAnalytics() {
    isLoading = true;
    error = null;

    try {
      const dateRange = { startDate, endDate };

      // Load job stats
      const jobStats = await analyticsStore.fetchJobStats(dateRange);

      // Update chart data
      updateChartData(jobStats);

      // Generate mock data for tables
      generateMockTableData();
    } catch (err) {
      error = err.message || "Failed to load job analytics";
      console.error("Analytics error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Handle date range change
  function handleDateRangeChange(event) {
    startDate = event.detail.startDate;
    endDate = event.detail.endDate;
    loadJobAnalytics();
  }

  // Update chart data based on loaded stats
  function updateChartData(stats) {
    if (stats) {
      // Update application funnel
      applicationFunnelData = {
        ...applicationFunnelData,
        datasets: [
          {
            ...applicationFunnelData.datasets[0],
            data: [
              stats.applicationsSubmitted || 0,
              stats.applicationsViewed || 0,
              stats.interviewInvites || 0,
              stats.jobOffers || 0,
              stats.jobOffers ? Math.ceil(stats.jobOffers * 0.6) : 0, // Mock hired number
            ],
          },
        ],
      };

      // Generate monthly application trend
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentMonth = new Date().getMonth();
      const labels = [];
      const applicationData = [];

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i) % 12;
        const month = months[monthIndex < 0 ? monthIndex + 12 : monthIndex];
        labels.push(month);

        // Generate mock data for monthly trends
        if (i === 0) {
          applicationData.push(stats.applicationsSubmitted || 0);
        } else {
          applicationData.push(Math.floor(Math.random() * 10) + 2);
        }
      }

      applicationTrendData = {
        ...applicationTrendData,
        labels,
        datasets: [
          {
            ...applicationTrendData.datasets[0],
            data: applicationData,
          },
        ],
      };

      // Response rate by job category
      responseRateData = {
        ...responseRateData,
        labels: ["Design", "Development", "Product", "Management", "Marketing"],
        datasets: [
          {
            ...responseRateData.datasets[0],
            data: [12, 19, 8, 5, 4],
          },
          {
            ...responseRateData.datasets[1],
            data: [8, 12, 6, 3, 2],
          },
        ],
      };
    }
  }

  // Generate mock table data for demonstration
  function generateMockTableData() {
    // Application data
    applicationData = [
      {
        id: 1,
        company: "Tech Innovations Inc.",
        position: "Senior Frontend Developer",
        appliedDate: "2025-08-15",
        status: "Interview",
        response: "Yes",
        responseTime: 3,
      },
      {
        id: 2,
        company: "Design Solutions Co.",
        position: "UI/UX Designer",
        appliedDate: "2025-08-18",
        status: "Rejected",
        response: "Yes",
        responseTime: 7,
      },
      {
        id: 3,
        company: "StartApp Ventures",
        position: "Full Stack Engineer",
        appliedDate: "2025-08-21",
        status: "Offer",
        response: "Yes",
        responseTime: 10,
      },
      {
        id: 4,
        company: "GlobalCorp Ltd.",
        position: "Product Designer",
        appliedDate: "2025-08-24",
        status: "Application Viewed",
        response: "No",
        responseTime: null,
      },
      {
        id: 5,
        company: "Creative Digital Agency",
        position: "Creative Director",
        appliedDate: "2025-08-27",
        status: "Application Sent",
        response: "No",
        responseTime: null,
      },
      {
        id: 6,
        company: "Software Solutions Inc.",
        position: "Frontend Developer",
        appliedDate: "2025-08-30",
        status: "Interview",
        response: "Yes",
        responseTime: 2,
      },
      {
        id: 7,
        company: "Enterprise Systems Ltd.",
        position: "Systems Architect",
        appliedDate: "2025-09-01",
        status: "Application Viewed",
        response: "No",
        responseTime: null,
      },
    ];

    // Company response data
    companyResponseData = [
      {
        company: "Tech Innovations Inc.",
        applications: 3,
        responses: 3,
        interviews: 2,
        offers: 1,
        avgResponseTime: 2,
      },
      {
        company: "Design Solutions Co.",
        applications: 2,
        responses: 2,
        interviews: 1,
        offers: 0,
        avgResponseTime: 5,
      },
      {
        company: "StartApp Ventures",
        applications: 2,
        responses: 2,
        interviews: 2,
        offers: 1,
        avgResponseTime: 1,
      },
      {
        company: "GlobalCorp Ltd.",
        applications: 4,
        responses: 2,
        interviews: 1,
        offers: 0,
        avgResponseTime: 8,
      },
      {
        company: "Creative Digital Agency",
        applications: 1,
        responses: 0,
        interviews: 0,
        offers: 0,
        avgResponseTime: null,
      },
      {
        company: "Software Solutions Inc.",
        applications: 2,
        responses: 2,
        interviews: 1,
        offers: 0,
        avgResponseTime: 3,
      },
      {
        company: "Enterprise Systems Ltd.",
        applications: 3,
        responses: 1,
        interviews: 0,
        offers: 0,
        avgResponseTime: 6,
      },
    ];
  }
</script>

<svelte:head>
  <title>Job Application Analytics | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Job Application Analytics"
    description="Track your job applications and interview progress"
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
      title="Applications"
      value={$analyticsStore.jobStats?.applicationsSubmitted || 0}
      previousValue={12}
      percentChange={41.7}
      color="primary"
      loading={isLoading}
    />

    <KpiCard
      title="Response Rate"
      value={$analyticsStore.jobStats?.applicationsViewed
        ? ($analyticsStore.jobStats.interviewInvites /
            $analyticsStore.jobStats.applicationsViewed) *
          100
        : 0}
      previousValue={38.5}
      percentChange={8.3}
      format="percent"
      color="success"
      loading={isLoading}
    />

    <KpiCard
      title="Interview Invites"
      value={$analyticsStore.jobStats?.interviewInvites || 0}
      previousValue={4}
      percentChange={25}
      color="warning"
      loading={isLoading}
    />

    <KpiCard
      title="Job Offers"
      value={$analyticsStore.jobStats?.jobOffers || 0}
      previousValue={1}
      percentChange={100}
      color="info"
      loading={isLoading}
    />
  </div>

  <!-- Main Charts Row -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- Application Funnel -->
    <AnalyticsWidget
      title="Application Funnel"
      description="Track your application progress"
      loading={isLoading}
    >
      <Chart
        type="doughnut"
        data={applicationFunnelData}
        options={{
          plugins: {
            legend: {
              position: "right",
            },
          },
        }}
      />
    </AnalyticsWidget>

    <!-- Application Trend -->
    <AnalyticsWidget
      title="Application Trends"
      description="Monthly application activity"
      loading={isLoading}
    >
      <Chart
        type="line"
        data={applicationTrendData}
        options={{
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Applications",
              },
            },
          },
        }}
      />
    </AnalyticsWidget>
  </div>

  <!-- Applications Table -->
  <AnalyticsWidget
    title="Application Status"
    description="Current status of all your job applications"
    loading={isLoading}
    fullWidth={true}
  >
    <DataTable
      data={applicationData}
      columns={[
        { key: "company", title: "Company", sortable: true },
        { key: "position", title: "Position", sortable: true },
        { key: "appliedDate", title: "Applied Date", sortable: true },
        {
          key: "status",
          title: "Status",
          sortable: true,
          format: (value) => {
            const colors = {
              "Application Sent":
                "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300",
              "Application Viewed":
                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
              Interview:
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
              Offer:
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
              Rejected:
                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
              Hired:
                "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
            };
            return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colors[value] || ""}">${value}</span>`;
          },
        },
        {
          key: "response",
          title: "Response",
          sortable: true,
        },
        {
          key: "responseTime",
          title: "Response Time (days)",
          align: "right",
          sortable: true,
          format: (value) => (value === null ? "-" : value),
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
      pagination={true}
    />
  </AnalyticsWidget>

  <!-- Two Columns Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <!-- Company Response Rates -->
    <AnalyticsWidget
      title="Company Response Rates"
      description="How companies are responding to your applications"
      loading={isLoading}
    >
      <DataTable
        data={companyResponseData}
        columns={[
          { key: "company", title: "Company", sortable: true },
          {
            key: "applications",
            title: "Apps",
            align: "right",
            sortable: true,
          },
          { key: "responses", title: "Resp", align: "right", sortable: true },
          {
            key: "avgResponseTime",
            title: "Avg Time",
            align: "right",
            format: (value) => (value === null ? "-" : `${value} days`),
            sortable: true,
          },
        ]}
      />
    </AnalyticsWidget>

    <!-- Response Rate by Category -->
    <AnalyticsWidget
      title="Response Rate by Job Category"
      description="Which job categories have better response rates"
      loading={isLoading}
    >
      <Chart
        type="bar"
        data={responseRateData}
        options={{
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Count",
              },
            },
            x: {
              title: {
                display: true,
                text: "Job Category",
              },
            },
          },
        }}
      />
    </AnalyticsWidget>
  </div>

  <!-- Tips and Insights -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Application Insights"
      description="AI-powered recommendations to improve your job search"
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Response Rate Analysis</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Applications with tailored cover letters receive 35% more
                  responses. Consider customizing your cover letter for each
                  application.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Cover Letter Tips
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Best Performing Job Types</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Your Frontend Developer applications have a 62% response rate.
                  Consider focusing more on this role type.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  View Matching Jobs
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Application Timing</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Applications submitted on Tuesday and Wednesday mornings
                  receive responses 28% faster than other times.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Schedule Applications
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div class="ml-4">
            <h4 class="text-sm font-medium">Quick Tip</h4>
            <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Follow up with Tech Innovations Inc. regarding your Senior
              Frontend Developer position. Companies that receive follow-ups
              within 7-10 days are 22% more likely to schedule an interview.
            </p>
          </div>
        </div>
      </div>
    </AnalyticsWidget>
  </div>
</div>
