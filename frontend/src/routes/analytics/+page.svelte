<script lang="ts">
  import { onMount } from "svelte";
  import { subDays } from "date-fns";
  import { analyticsStore } from "$lib/stores/analyticsStore";
  import { initAnalytics } from "$lib/services/analyticsService";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import DateRangePicker from "$lib/components/analytics/DateRangePicker.svelte";
  import KpiCard from "$lib/components/analytics/KpiCard.svelte";
  import AnalyticsWidget from "$lib/components/analytics/AnalyticsWidget.svelte";
  import Chart from "$lib/components/analytics/Chart.svelte";
  import DataTable from "$lib/components/analytics/DataTable.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";

  // Date range state
  let startDate = subDays(new Date(), 30);
  let endDate = new Date();

  // Active tab
  let activeTab = "overview";

  // Loading states
  let isLoading = true;
  let error: string | null = null;

  // Chart data
  let portfolioViewsData = {
    labels: [],
    datasets: [
      {
        label: "Portfolio Views",
        data: [],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  let engagementData = {
    labels: [],
    datasets: [
      {
        label: "Likes",
        data: [],
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 2,
      },
      {
        label: "Comments",
        data: [],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
      },
      {
        label: "Shares",
        data: [],
        backgroundColor: "rgba(245, 158, 11, 0.7)",
        borderColor: "rgb(245, 158, 11)",
        borderWidth: 2,
      },
    ],
  };

  let jobApplicationsData = {
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

  let topReferrers = [];
  let recentVisitors = [];

  // Initialize analytics and load data
  onMount(() => {
    initAnalytics();
    loadAnalyticsData();
  });

  // Load all analytics data based on date range
  async function loadAnalyticsData() {
    isLoading = true;
    error = null;

    try {
      const dateRange = { startDate, endDate };

      // Load portfolio stats
      await analyticsStore.fetchPortfolioStats("current", dateRange);

      // Load profile stats
      await analyticsStore.fetchProfileStats(dateRange);

      // Load job stats
      await analyticsStore.fetchJobStats(dateRange);

      // Load engagement stats
      await analyticsStore.fetchEngagementStats(dateRange);

      // Update chart data
      updateChartData();

      // Mock data for tables
      generateMockTableData();
    } catch (err) {
      error = err.message || "Failed to load analytics data";
      console.error("Analytics error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Handle date range change
  function handleDateRangeChange(event) {
    startDate = event.detail.startDate;
    endDate = event.detail.endDate;
    loadAnalyticsData();
  }

  // Update chart data based on loaded stats
  function updateChartData() {
    const { portfolioStats, engagementStats, jobStats } = $analyticsStore;

    // Update portfolio views chart
    if (portfolioStats?.viewsByDate) {
      portfolioViewsData = {
        ...portfolioViewsData,
        labels: portfolioStats.viewsByDate.map((item) => item.date),
        datasets: [
          {
            ...portfolioViewsData.datasets[0],
            data: portfolioStats.viewsByDate.map((item) => item.count),
          },
        ],
      };
    }

    // Update engagement chart
    if (engagementStats?.engagementByDate) {
      engagementData = {
        ...engagementData,
        labels: engagementStats.engagementByDate.map((item) => item.date),
        datasets: [
          {
            ...engagementData.datasets[0],
            data: engagementStats.engagementByDate.map((item) => item.likes),
          },
          {
            ...engagementData.datasets[1],
            data: engagementStats.engagementByDate.map((item) => item.comments),
          },
          {
            ...engagementData.datasets[2],
            data: engagementStats.engagementByDate.map((item) => item.shares),
          },
        ],
      };
    }

    // Update job applications chart
    if (jobStats) {
      jobApplicationsData = {
        ...jobApplicationsData,
        datasets: [
          {
            ...jobApplicationsData.datasets[0],
            data: [
              jobStats.applicationsSubmitted || 0,
              jobStats.applicationsViewed || 0,
              jobStats.interviewInvites || 0,
              jobStats.jobOffers || 0,
              5, // Mock hired number
            ],
          },
        ],
      };
    }
  }

  // Generate mock table data for demonstration
  function generateMockTableData() {
    // Top referrers data
    topReferrers = [
      { source: "linkedin.com", count: 142, percentage: 34.5 },
      { source: "google.com", count: 89, percentage: 21.6 },
      { source: "github.com", count: 76, percentage: 18.4 },
      { source: "twitter.com", count: 52, percentage: 12.6 },
      { source: "portfolia.com", count: 31, percentage: 7.5 },
      { source: "stackoverflow.com", count: 18, percentage: 4.4 },
      { source: "dev.to", count: 4, percentage: 1.0 },
    ];

    // Recent visitors data
    recentVisitors = [
      {
        id: "1",
        name: "Sarah Johnson",
        company: "Tech Innovations Inc.",
        position: "CTO",
        viewedAt: "2025-09-01T14:23:00Z",
        timeOnPage: 245,
        avatar: "/images/avatars/user1.jpg",
      },
      {
        id: "2",
        name: "Michael Chen",
        company: "Digital Solutions Ltd",
        position: "Lead Developer",
        viewedAt: "2025-09-01T12:05:00Z",
        timeOnPage: 192,
        avatar: "/images/avatars/user2.jpg",
      },
      {
        id: "3",
        name: "Jessica Williams",
        company: "Creative Agency Group",
        position: "Design Director",
        viewedAt: "2025-08-31T20:47:00Z",
        timeOnPage: 318,
        avatar: "/images/avatars/user3.jpg",
      },
      {
        id: "4",
        name: "Thomas Parker",
        company: "Enterprise Software Co",
        position: "HR Manager",
        viewedAt: "2025-08-31T17:12:00Z",
        timeOnPage: 87,
        avatar: "/images/avatars/user4.jpg",
      },
      {
        id: "5",
        name: "Amanda Lee",
        company: "StartUp Ventures",
        position: "CEO",
        viewedAt: "2025-08-30T09:34:00Z",
        timeOnPage: 412,
        avatar: "/images/avatars/user5.jpg",
      },
    ];
  }
</script>

<svelte:head>
  <title>Analytics Dashboard | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Analytics Dashboard"
    description="Track performance and gain insights into your professional presence"
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

  <Tabs
    tabs={[
      { id: "overview", label: "Overview" },
      { id: "portfolio", label: "Portfolio Analytics" },
      { id: "social", label: "Social Engagement" },
      { id: "jobs", label: "Job Applications" },
      { id: "monetization", label: "Monetization" },
    ]}
    bind:activeTab
    class="mb-6"
  />

  {#if activeTab === "overview"}
    <!-- Overview Dashboard -->
    <div class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Portfolio Views"
          value={$analyticsStore.portfolioStats?.totalViews || 0}
          previousValue={354}
          percentChange={8.2}
          color="primary"
          loading={isLoading}
        />

        <KpiCard
          title="Profile Views"
          value={$analyticsStore.profileStats?.profileViews || 0}
          previousValue={187}
          percentChange={-3.8}
          color="secondary"
          loading={isLoading}
        />

        <KpiCard
          title="Job Applications"
          value={$analyticsStore.jobStats?.applicationsSubmitted || 0}
          previousValue={8}
          percentChange={25}
          color="success"
          loading={isLoading}
        />

        <KpiCard
          title="Engagement Rate"
          value={$analyticsStore.engagementStats?.averageEngagementRate || 0}
          previousValue={3.2}
          percentChange={15.6}
          format="percent"
          color="info"
          loading={isLoading}
        />
      </div>

      <!-- Main charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsWidget
          title="Portfolio Traffic"
          description="Daily views of your portfolio"
          loading={isLoading}
        >
          <Chart
            type="line"
            data={portfolioViewsData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Social Engagement"
          description="Interactions with your content"
          loading={isLoading}
        >
          <Chart
            type="bar"
            data={engagementData}
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

      <!-- Second row charts and tables -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsWidget
          title="Job Application Funnel"
          description="Track your application progress"
          loading={isLoading}
        >
          <Chart
            type="doughnut"
            data={jobApplicationsData}
            options={{
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Top Traffic Sources"
          description="Where your visitors are coming from"
          loading={isLoading}
        >
          <DataTable
            data={topReferrers}
            columns={[
              { key: "source", title: "Source", sortable: true },
              { key: "count", title: "Views", align: "right", sortable: true },
              {
                key: "percentage",
                title: "%",
                align: "right",
                format: (value) => `${value}%`,
              },
            ]}
          />
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Recent Profile Visitors"
          description="People who viewed your profile"
          loading={isLoading}
        >
          <div class="space-y-3">
            {#each recentVisitors as visitor}
              <div
                class="flex items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-md"
              >
                <div class="mr-3">
                  <Avatar src={visitor.avatar} alt={visitor.name} size="md" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{visitor.name}</p>
                  <p
                    class="text-xs text-neutral-500 dark:text-neutral-400 truncate"
                  >
                    {visitor.position} at {visitor.company}
                  </p>
                </div>
                <div class="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(visitor.viewedAt).toLocaleDateString()}
                </div>
              </div>
            {/each}

            <div class="text-center pt-2">
              <Button variant="ghost" size="sm">View All Visitors</Button>
            </div>
          </div>
        </AnalyticsWidget>
      </div>
    </div>
  {:else if activeTab === "portfolio"}
    <!-- Portfolio Analytics Tab -->
    <div class="space-y-6">
      <!-- Portfolio KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Views"
          value={$analyticsStore.portfolioStats?.totalViews || 0}
          color="primary"
          loading={isLoading}
        />

        <KpiCard
          title="Unique Visitors"
          value={$analyticsStore.portfolioStats?.uniqueVisitors || 0}
          color="secondary"
          loading={isLoading}
        />

        <KpiCard
          title="Avg. Time on Page"
          value={$analyticsStore.portfolioStats?.averageTimeOnPage || 0}
          format="time"
          color="info"
          loading={isLoading}
        />

        <KpiCard
          title="Conversion Rate"
          value={$analyticsStore.portfolioStats?.conversionRate || 0}
          format="percent"
          color="success"
          loading={isLoading}
        />
      </div>

      <!-- Portfolio Traffic Chart -->
      <AnalyticsWidget
        title="Portfolio Traffic"
        description="Daily views of your portfolio"
        loading={isLoading}
        fullWidth={true}
      >
        <Chart
          type="line"
          data={portfolioViewsData}
          options={{
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </AnalyticsWidget>

      <!-- Location and Referrer Data -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsWidget
          title="Visitor Locations"
          description="Geographic distribution of your visitors"
          loading={isLoading}
        >
          <div
            class="h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-md"
          >
            <div class="text-center">
              <p class="text-neutral-500 dark:text-neutral-400">
                Map visualization would go here
              </p>
              <Button variant="ghost" size="sm" class="mt-2"
                >View Full Map</Button
              >
            </div>
          </div>
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Traffic Sources"
          description="Where your visitors are coming from"
          loading={isLoading}
        >
          <DataTable
            data={topReferrers}
            columns={[
              { key: "source", title: "Source", sortable: true },
              { key: "count", title: "Views", align: "right", sortable: true },
              {
                key: "percentage",
                title: "%",
                align: "right",
                format: (value) => `${value}%`,
              },
            ]}
          />
        </AnalyticsWidget>
      </div>

      <!-- Portfolio Performance -->
      <AnalyticsWidget
        title="Portfolio Section Performance"
        description="How visitors are engaging with each section"
        loading={isLoading}
        fullWidth={true}
      >
        <DataTable
          data={[
            {
              section: "Introduction",
              views: 412,
              timeSpent: 45,
              bounceRate: 12,
            },
            {
              section: "Work Experience",
              views: 387,
              timeSpent: 120,
              bounceRate: 8,
            },
            { section: "Projects", views: 356, timeSpent: 185, bounceRate: 5 },
            {
              section: "Skills & Expertise",
              views: 298,
              timeSpent: 72,
              bounceRate: 15,
            },
            { section: "Education", views: 245, timeSpent: 43, bounceRate: 22 },
            {
              section: "Testimonials",
              views: 212,
              timeSpent: 58,
              bounceRate: 14,
            },
            {
              section: "Contact Information",
              views: 176,
              timeSpent: 37,
              bounceRate: 18,
            },
          ]}
          columns={[
            { key: "section", title: "Portfolio Section", sortable: true },
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
          pagination={true}
        />
      </AnalyticsWidget>
    </div>
  {:else if activeTab === "social"}
    <!-- Social Engagement Tab -->
    <div class="space-y-6">
      <!-- Social Engagement KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Posts"
          value={$analyticsStore.engagementStats?.postsCreated || 0}
          color="primary"
          loading={isLoading}
        />

        <KpiCard
          title="Total Likes"
          value={$analyticsStore.engagementStats?.totalLikes || 0}
          color="danger"
          loading={isLoading}
        />

        <KpiCard
          title="Total Comments"
          value={$analyticsStore.engagementStats?.totalComments || 0}
          color="secondary"
          loading={isLoading}
        />

        <KpiCard
          title="Engagement Rate"
          value={$analyticsStore.engagementStats?.averageEngagementRate || 0}
          format="percent"
          color="success"
          loading={isLoading}
        />
      </div>

      <!-- Engagement Over Time Chart -->
      <AnalyticsWidget
        title="Engagement Over Time"
        description="Likes, comments, and shares on your content"
        loading={isLoading}
        fullWidth={true}
      >
        <Chart
          type="bar"
          data={engagementData}
          options={{
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </AnalyticsWidget>

      <!-- Top Performing Posts -->
      <AnalyticsWidget
        title="Top Performing Content"
        description="Your most engaging posts"
        loading={isLoading}
        fullWidth={true}
      >
        <DataTable
          data={[
            {
              postId: 1,
              title: "How I Built a Scalable Web Application with SvelteKit",
              type: "Article",
              likes: 142,
              comments: 37,
              shares: 28,
              engagement: 14.3,
            },
            {
              postId: 2,
              title: "My Journey from Junior to Senior Developer in 18 Months",
              type: "Story",
              likes: 98,
              comments: 52,
              shares: 41,
              engagement: 12.8,
            },
            {
              postId: 3,
              title: "Portfolio Redesign Process - Before and After",
              type: "Case Study",
              likes: 87,
              comments: 24,
              shares: 19,
              engagement: 9.7,
            },
            {
              postId: 4,
              title: "5 Essential Skills for Frontend Developers in 2025",
              type: "List",
              likes: 76,
              comments: 31,
              shares: 43,
              engagement: 11.4,
            },
            {
              postId: 5,
              title: "Just launched my new AI side project!",
              type: "Update",
              likes: 65,
              comments: 18,
              shares: 12,
              engagement: 7.2,
            },
          ]}
          columns={[
            { key: "title", title: "Post Title", sortable: true },
            { key: "type", title: "Type", sortable: true },
            { key: "likes", title: "Likes", align: "right", sortable: true },
            {
              key: "comments",
              title: "Comments",
              align: "right",
              sortable: true,
            },
            { key: "shares", title: "Shares", align: "right", sortable: true },
            {
              key: "engagement",
              title: "Engagement %",
              align: "right",
              format: (value) => `${value}%`,
              sortable: true,
            },
          ]}
          pagination={true}
        />
      </AnalyticsWidget>

      <!-- Audience Demographics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsWidget
          title="Audience Demographics"
          description="Who's engaging with your content"
          loading={isLoading}
        >
          <div class="grid grid-cols-2 gap-4 h-64">
            <div class="flex flex-col">
              <h4 class="text-sm font-medium mb-2">Age Distribution</h4>
              <Chart
                type="pie"
                data={{
                  labels: ["18-24", "25-34", "35-44", "45-54", "55+"],
                  datasets: [
                    {
                      data: [15, 38, 27, 14, 6],
                      backgroundColor: [
                        "rgba(59, 130, 246, 0.7)",
                        "rgba(16, 185, 129, 0.7)",
                        "rgba(245, 158, 11, 0.7)",
                        "rgba(139, 92, 246, 0.7)",
                        "rgba(236, 72, 153, 0.7)",
                      ],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        font: {
                          size: 11,
                        },
                      },
                    },
                  },
                }}
              />
            </div>

            <div class="flex flex-col">
              <h4 class="text-sm font-medium mb-2">Industry</h4>
              <Chart
                type="pie"
                data={{
                  labels: [
                    "Tech",
                    "Design",
                    "Marketing",
                    "Finance",
                    "Education",
                    "Other",
                  ],
                  datasets: [
                    {
                      data: [42, 23, 14, 8, 7, 6],
                      backgroundColor: [
                        "rgba(59, 130, 246, 0.7)",
                        "rgba(16, 185, 129, 0.7)",
                        "rgba(245, 158, 11, 0.7)",
                        "rgba(139, 92, 246, 0.7)",
                        "rgba(236, 72, 153, 0.7)",
                        "rgba(75, 85, 99, 0.7)",
                      ],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        font: {
                          size: 11,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Growth Trends"
          description="Your follower and engagement growth"
          loading={isLoading}
        >
          <Chart
            type="line"
            data={{
              labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
              ],
              datasets: [
                {
                  label: "Followers",
                  data: [124, 186, 247, 312, 389, 421, 498, 567, 642],
                  borderColor: "rgb(59, 130, 246)",
                  tension: 0.4,
                  yAxisID: "y",
                },
                {
                  label: "Engagement Rate",
                  data: [5.2, 4.8, 6.1, 5.4, 7.2, 6.8, 8.1, 7.6, 8.4],
                  borderColor: "rgb(16, 185, 129)",
                  tension: 0.4,
                  borderDash: [5, 5],
                  yAxisID: "y1",
                },
              ],
            }}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Followers",
                  },
                },
                y1: {
                  beginAtZero: true,
                  position: "right",
                  grid: {
                    drawOnChartArea: false,
                  },
                  title: {
                    display: true,
                    text: "Engagement %",
                  },
                  ticks: {
                    callback: function (value) {
                      return value + "%";
                    },
                  },
                },
              },
            }}
          />
        </AnalyticsWidget>
      </div>
    </div>
  {:else if activeTab === "jobs"}
    <!-- Job Applications Tab -->
    <div class="space-y-6">
      <!-- Job Applications KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Applications"
          value={$analyticsStore.jobStats?.applicationsSubmitted || 0}
          color="primary"
          loading={isLoading}
        />

        <KpiCard
          title="Interview Invites"
          value={$analyticsStore.jobStats?.interviewInvites || 0}
          color="secondary"
          loading={isLoading}
        />

        <KpiCard
          title="Job Offers"
          value={$analyticsStore.jobStats?.jobOffers || 0}
          color="success"
          loading={isLoading}
        />

        <KpiCard
          title="Conversion Rate"
          value={$analyticsStore.jobStats?.conversionRate || 0}
          format="percent"
          color="info"
          loading={isLoading}
        />
      </div>

      <!-- Application Funnel -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsWidget
          title="Application Funnel"
          description="Track your application progress"
          loading={isLoading}
        >
          <Chart
            type="doughnut"
            data={jobApplicationsData}
            options={{
              plugins: {
                legend: {
                  position: "right",
                },
              },
            }}
          />
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Applications by Company"
          description="Where you've applied"
          loading={isLoading}
        >
          <Chart
            type="bar"
            data={{
              labels: [
                "Tech Co",
                "Design Inc",
                "StartApp",
                "GlobalCorp",
                "Creative Ltd",
              ],
              datasets: [
                {
                  label: "Applications",
                  data: [8, 5, 4, 3, 2],
                  backgroundColor: "rgba(59, 130, 246, 0.7)",
                },
              ],
            }}
            options={{
              indexAxis: "y",
              scales: {
                x: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </AnalyticsWidget>
      </div>

      <!-- Application Status Table -->
      <AnalyticsWidget
        title="Application Status"
        description="Current status of all your job applications"
        loading={isLoading}
        fullWidth={true}
      >
        <DataTable
          data={[
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
          ]}
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
                  "Application Sent": "bg-neutral-100 text-neutral-800",
                  "Application Viewed": "bg-blue-100 text-blue-800",
                  Interview: "bg-yellow-100 text-yellow-800",
                  Offer: "bg-green-100 text-green-800",
                  Rejected: "bg-red-100 text-red-800",
                  Hired: "bg-purple-100 text-purple-800",
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
          ]}
          pagination={true}
        />
      </AnalyticsWidget>

      <!-- Response Rate Chart -->
      <AnalyticsWidget
        title="Application Response Rates"
        description="How companies are responding to your applications"
        loading={isLoading}
        fullWidth={true}
      >
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="col-span-1">
            <Chart
              type="pie"
              data={{
                labels: ["Responded", "No Response"],
                datasets: [
                  {
                    data: [65, 35],
                    backgroundColor: [
                      "rgba(16, 185, 129, 0.7)",
                      "rgba(239, 68, 68, 0.7)",
                    ],
                  },
                ],
              }}
            />
          </div>
          <div class="lg:col-span-2">
            <Chart
              type="bar"
              data={{
                labels: [
                  "Design",
                  "Development",
                  "Product",
                  "Management",
                  "Marketing",
                ],
                datasets: [
                  {
                    label: "Applications",
                    data: [12, 19, 8, 5, 4],
                    backgroundColor: "rgba(59, 130, 246, 0.7)",
                  },
                  {
                    label: "Responses",
                    data: [8, 12, 6, 3, 2],
                    backgroundColor: "rgba(16, 185, 129, 0.7)",
                  },
                ],
              }}
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
          </div>
        </div>
      </AnalyticsWidget>
    </div>
  {:else if activeTab === "monetization"}
    <!-- Monetization Tab -->
    <div class="space-y-6">
      <!-- Monetization KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={$analyticsStore.monetizationStats?.totalRevenue || 0}
          format="currency"
          color="success"
          loading={isLoading}
        />

        <KpiCard
          title="Subscription Revenue"
          value={$analyticsStore.monetizationStats?.subscriptionRevenue || 0}
          format="currency"
          color="primary"
          loading={isLoading}
        />

        <KpiCard
          title="Product Sales"
          value={$analyticsStore.monetizationStats?.productSales || 0}
          format="currency"
          color="secondary"
          loading={isLoading}
        />

        <KpiCard
          title="Avg. Customer Value"
          value={$analyticsStore.monetizationStats?.customerLifetimeValue || 0}
          format="currency"
          color="info"
          loading={isLoading}
        />
      </div>

      <!-- Revenue Over Time -->
      <AnalyticsWidget
        title="Revenue Over Time"
        description="Monthly revenue breakdown"
        loading={isLoading}
        fullWidth={true}
      >
        <Chart
          type="line"
          data={{
            labels: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
            ],
            datasets: [
              {
                label: "Total Revenue",
                data: [1200, 1350, 1800, 1650, 2100, 2400, 2300, 2700, 3100],
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                borderColor: "rgb(16, 185, 129)",
                borderWidth: 2,
                tension: 0.4,
                fill: true,
              },
              {
                label: "Subscription Revenue",
                data: [800, 950, 1100, 1050, 1300, 1500, 1400, 1600, 1800],
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 2,
                tension: 0.4,
              },
              {
                label: "Product Sales",
                data: [400, 400, 700, 600, 800, 900, 900, 1100, 1300],
                borderColor: "rgb(139, 92, 246)",
                borderWidth: 2,
                tension: 0.4,
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
      </AnalyticsWidget>

      <!-- Revenue Sources -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsWidget
          title="Revenue by Product"
          description="Which products are generating revenue"
          loading={isLoading}
        >
          <Chart
            type="pie"
            data={{
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
            }}
          />
        </AnalyticsWidget>

        <AnalyticsWidget
          title="Subscriber Growth"
          description="Growth in paying subscribers"
          loading={isLoading}
        >
          <Chart
            type="line"
            data={{
              labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
              ],
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
            }}
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
      <AnalyticsWidget
        title="Top Selling Products"
        description="Your best performing digital products"
        loading={isLoading}
        fullWidth={true}
      >
        <DataTable
          data={[
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
          ]}
          columns={[
            { key: "product", title: "Product", sortable: true },
            {
              key: "price",
              title: "Price",
              align: "right",
              format: (value) => `$${value}`,
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
              format: (value) => `$${value.toFixed(2)}`,
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
          ]}
        />
      </AnalyticsWidget>
    </div>
  {/if}

  <!-- Generate Reports Section -->
  <div class="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-medium mb-1">Custom Reports</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Create and schedule custom analytics reports
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <Button variant="primary">
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
          Create Report
        </Button>
      </div>
    </div>

    <div class="mt-6">
      <Card>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead
              class="bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >Report Name</th
                >
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >Type</th
                >
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >Schedule</th
                >
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >Last Run</th
                >
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >Recipients</th
                >
                <th
                  class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  >Actions</th
                >
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700"
            >
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                <td class="px-4 py-3">Monthly Portfolio Performance</td>
                <td class="px-4 py-3">Portfolio</td>
                <td class="px-4 py-3">Monthly</td>
                <td class="px-4 py-3">2025-09-01</td>
                <td class="px-4 py-3">1 recipient</td>
                <td class="px-4 py-3 text-right">
                  <Button variant="ghost" size="xs">Edit</Button>
                  <Button variant="ghost" size="xs">Run</Button>
                </td>
              </tr>
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                <td class="px-4 py-3">Weekly Job Applications</td>
                <td class="px-4 py-3">Job</td>
                <td class="px-4 py-3">Weekly</td>
                <td class="px-4 py-3">2025-08-28</td>
                <td class="px-4 py-3">2 recipients</td>
                <td class="px-4 py-3 text-right">
                  <Button variant="ghost" size="xs">Edit</Button>
                  <Button variant="ghost" size="xs">Run</Button>
                </td>
              </tr>
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                <td class="px-4 py-3">Social Engagement Report</td>
                <td class="px-4 py-3">Engagement</td>
                <td class="px-4 py-3">Weekly</td>
                <td class="px-4 py-3">2025-08-28</td>
                <td class="px-4 py-3">1 recipient</td>
                <td class="px-4 py-3 text-right">
                  <Button variant="ghost" size="xs">Edit</Button>
                  <Button variant="ghost" size="xs">Run</Button>
                </td>
              </tr>
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                <td class="px-4 py-3">Quarterly Revenue Analysis</td>
                <td class="px-4 py-3">Monetization</td>
                <td class="px-4 py-3">Quarterly</td>
                <td class="px-4 py-3">2025-06-30</td>
                <td class="px-4 py-3">3 recipients</td>
                <td class="px-4 py-3 text-right">
                  <Button variant="ghost" size="xs">Edit</Button>
                  <Button variant="ghost" size="xs">Run</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
</div>
