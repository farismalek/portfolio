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

  let audienceDemographicsData = {
    age: {
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
    },
    industry: {
      labels: ["Tech", "Design", "Marketing", "Finance", "Education", "Other"],
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
    },
  };

  let followerGrowthData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    datasets: [
      {
        label: "Followers",
        data: [124, 186, 247, 312, 389, 421, 498, 567, 642],
        borderColor: "rgb(59, 130, 246)",
        tension: 0.4,
        yAxisID: "y",
        fill: false,
      },
      {
        label: "Engagement Rate",
        data: [5.2, 4.8, 6.1, 5.4, 7.2, 6.8, 8.1, 7.6, 8.4],
        borderColor: "rgb(16, 185, 129)",
        tension: 0.4,
        borderDash: [5, 5],
        yAxisID: "y1",
        fill: false,
      },
    ],
  };

  // Table data
  let topPostsData = [];
  let recentEngagementData = [];

  onMount(() => {
    // Track this page view
    trackEvent(EventCategory.SYSTEM, EventType.PAGE_VIEW, {
      page: "engagement-analytics",
    });

    loadEngagementAnalytics();
  });

  async function loadEngagementAnalytics() {
    isLoading = true;
    error = null;

    try {
      const dateRange = { startDate, endDate };

      // Load engagement stats
      const engagementStats =
        await analyticsStore.fetchEngagementStats(dateRange);

      // Update chart data
      updateChartData(engagementStats);

      // Generate mock data for tables
      generateMockTableData();
    } catch (err) {
      error = err.message || "Failed to load engagement analytics";
      console.error("Analytics error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Handle date range change
  function handleDateRangeChange(event) {
    startDate = event.detail.startDate;
    endDate = event.detail.endDate;
    loadEngagementAnalytics();
  }

  // Update chart data based on loaded stats
  function updateChartData(stats) {
    if (stats?.engagementByDate) {
      engagementData = {
        ...engagementData,
        labels: stats.engagementByDate.map((item) => item.date),
        datasets: [
          {
            ...engagementData.datasets[0],
            data: stats.engagementByDate.map((item) => item.likes),
          },
          {
            ...engagementData.datasets[1],
            data: stats.engagementByDate.map((item) => item.comments),
          },
          {
            ...engagementData.datasets[2],
            data: stats.engagementByDate.map((item) => item.shares),
          },
        ],
      };
    }
  }

  // Generate mock table data for demonstration
  function generateMockTableData() {
    // Top posts data
    topPostsData = [
      {
        postId: 1,
        title: "How I Built a Scalable Web Application with SvelteKit",
        type: "Article",
        date: "2025-08-15",
        likes: 142,
        comments: 37,
        shares: 28,
        engagement: 14.3,
      },
      {
        postId: 2,
        title: "My Journey from Junior to Senior Developer in 18 Months",
        type: "Story",
        date: "2025-07-23",
        likes: 98,
        comments: 52,
        shares: 41,
        engagement: 12.8,
      },
      {
        postId: 3,
        title: "Portfolio Redesign Process - Before and After",
        type: "Case Study",
        date: "2025-08-02",
        likes: 87,
        comments: 24,
        shares: 19,
        engagement: 9.7,
      },
      {
        postId: 4,
        title: "5 Essential Skills for Frontend Developers in 2025",
        type: "List",
        date: "2025-08-27",
        likes: 76,
        comments: 31,
        shares: 43,
        engagement: 11.4,
      },
      {
        postId: 5,
        title: "Just launched my new AI side project!",
        type: "Update",
        date: "2025-09-01",
        likes: 65,
        comments: 18,
        shares: 12,
        engagement: 7.2,
      },
    ];

    // Recent engagement data
    recentEngagementData = [
      {
        id: 1,
        user: "Sarah Johnson",
        action: "liked",
        content: "How I Built a Scalable Web Application with SvelteKit",
        timestamp: "2025-09-02T08:23:00Z",
      },
      {
        id: 2,
        user: "Michael Chen",
        action: "commented",
        content:
          "Great insights! I especially liked the section on state management.",
        timestamp: "2025-09-01T19:15:00Z",
      },
      {
        id: 3,
        user: "Jessica Williams",
        action: "shared",
        content: "My Journey from Junior to Senior Developer in 18 Months",
        timestamp: "2025-09-01T14:47:00Z",
      },
      {
        id: 4,
        user: "Thomas Parker",
        action: "liked",
        content: "Portfolio Redesign Process - Before and After",
        timestamp: "2025-09-01T10:32:00Z",
      },
      {
        id: 5,
        user: "Amanda Lee",
        action: "commented",
        content:
          "This is exactly what I needed. Thank you for sharing your experience!",
        timestamp: "2025-08-31T22:08:00Z",
      },
      {
        id: 6,
        user: "Robert Garcia",
        action: "liked",
        content: "5 Essential Skills for Frontend Developers in 2025",
        timestamp: "2025-08-31T16:55:00Z",
      },
      {
        id: 7,
        user: "Emily Davis",
        action: "shared",
        content: "Just launched my new AI side project!",
        timestamp: "2025-08-31T09:41:00Z",
      },
    ];
  }
</script>

<svelte:head>
  <title>Social Engagement Analytics | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Social Engagement Analytics"
    description="Track how users engage with your content"
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
      title="Total Posts"
      value={$analyticsStore.engagementStats?.postsCreated || 0}
      previousValue={12}
      percentChange={16.7}
      color="primary"
      loading={isLoading}
    />

    <KpiCard
      title="Total Likes"
      value={$analyticsStore.engagementStats?.totalLikes || 0}
      previousValue={387}
      percentChange={21.4}
      color="danger"
      loading={isLoading}
    />

    <KpiCard
      title="Total Comments"
      value={$analyticsStore.engagementStats?.totalComments || 0}
      previousValue={128}
      percentChange={28.1}
      color="secondary"
      loading={isLoading}
    />

    <KpiCard
      title="Engagement Rate"
      value={$analyticsStore.engagementStats?.averageEngagementRate || 0}
      previousValue={6.2}
      percentChange={14.5}
      format="percent"
      color="success"
      loading={isLoading}
    />
  </div>

  <!-- Main Chart -->
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
            title: {
              display: true,
              text: "Count",
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

  <!-- Top Performing Posts -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Top Performing Content"
      description="Your most engaging posts"
      loading={isLoading}
      fullWidth={true}
    >
      <DataTable
        data={topPostsData}
        columns={[
          {
            key: "title",
            title: "Post Title",
            sortable: true,
            format: (value, row) => `
              <div>
                <div class="font-medium">${value}</div>
                <div class="text-xs text-neutral-500 dark:text-neutral-400">${row.date} • ${row.type}</div>
              </div>
            `,
          },
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
          {
            key: "actions",
            title: "",
            align: "right",
            format: () => `
              <div class="flex justify-end space-x-2">
                <button class="text-xs px-3 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800">
                  View Post
                </button>
              </div>
            `,
          },
        ]}
        pagination={true}
      />
    </AnalyticsWidget>
  </div>

  <!-- Two Columns Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <!-- Audience Demographics -->
    <AnalyticsWidget
      title="Audience Demographics"
      description="Who's engaging with your content"
      loading={isLoading}
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col">
          <h4 class="text-sm font-medium mb-2">Age Distribution</h4>
          <Chart
            type="pie"
            data={audienceDemographicsData.age}
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
            data={audienceDemographicsData.industry}
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

    <!-- Growth Trends -->
    <AnalyticsWidget
      title="Growth Trends"
      description="Your follower and engagement growth"
      loading={isLoading}
    >
      <Chart
        type="line"
        data={followerGrowthData}
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

  <!-- Recent Engagement -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Recent Engagement"
      description="Latest interactions with your content"
      loading={isLoading}
      fullWidth={true}
    >
      <div class="space-y-4">
        {#each recentEngagementData as engagement}
          <div
            class="flex items-start p-3 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
          >
            <div class="flex-shrink-0 mr-3">
              <div
                class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400"
              >
                {engagement.user.charAt(0)}
              </div>
            </div>

            <div class="flex-grow min-w-0">
              <div class="flex items-center">
                <span class="font-medium">{engagement.user}</span>
                <span
                  class="text-xs text-neutral-500 dark:text-neutral-400 ml-2"
                >
                  {new Date(engagement.timestamp).toLocaleString()}
                </span>
              </div>

              <div class="mt-1">
                <span class="text-sm">
                  {#if engagement.action === "liked"}
                    <span class="text-rose-600 dark:text-rose-400">liked</span>
                  {:else if engagement.action === "commented"}
                    <span class="text-emerald-600 dark:text-emerald-400"
                      >commented on</span
                    >
                  {:else if engagement.action === "shared"}
                    <span class="text-amber-600 dark:text-amber-400"
                      >shared</span
                    >
                  {/if}

                  {#if engagement.action === "commented"}
                    <span class="text-neutral-600 dark:text-neutral-400"
                      >"{engagement.content}"</span
                    >
                  {:else}
                    <span class="text-neutral-600 dark:text-neutral-400"
                      >your post: "{engagement.content}"</span
                    >
                  {/if}
                </span>
              </div>
            </div>

            <div class="flex-shrink-0 ml-2">
              <button
                class="text-xs px-3 py-1 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                View
              </button>
            </div>
          </div>
        {/each}

        <div class="text-center pt-4">
          <Button variant="outline">View All Activity</Button>
        </div>
      </div>
    </AnalyticsWidget>
  </div>

  <!-- Content Strategy Recommendations -->
  <div class="mt-6">
    <AnalyticsWidget
      title="Content Strategy Recommendations"
      description="AI-powered insights to improve your engagement"
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Best Performing Content</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Tutorial posts receive 43% higher engagement than other
                  content types. Consider creating a tutorial series.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Tutorial
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Optimal Posting Time</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Posts published between 10am-12pm on Tuesdays and Thursdays
                  receive 27% more engagement.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Schedule Post
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
                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">Engagement Boost</h4>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Posts with images receive 62% more engagement. Try adding more
                  visual content to your posts.
                </p>
                <button
                  class="mt-2 text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Media Library
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div class="ml-4">
            <h4 class="text-sm font-medium">Content Gap Analysis</h4>
            <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Based on your audience interests, consider creating content about
              "Frontend Performance Optimization" and "Design Systems" which are
              trending topics in your network but missing from your content
              library.
            </p>
            <div class="mt-2 flex space-x-2">
              <button
                class="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Generate Content Ideas
              </button>
              <button
                class="text-xs px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600"
              >
                View Content Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsWidget>
  </div>
</div>
