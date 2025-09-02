<script lang="ts">
  import { portfolioEditorStore } from "$lib/stores/portfolioEditorStore";

  export let data: any = {};
  export let isEditing: boolean = false;

  // Provide default values for new components
  $: {
    if (isEditing) {
      data = {
        title: data.title || "My Skills",
        subtitle: data.subtitle || "Technologies and tools I work with",
        skills: data.skills || [
          { name: "UI/UX Design", level: 90, icon: "design" },
          { name: "HTML/CSS", level: 85, icon: "code" },
          { name: "JavaScript", level: 80, icon: "javascript" },
          { name: "React", level: 75, icon: "react" },
          { name: "Node.js", level: 70, icon: "server" },
          { name: "GraphQL", level: 65, icon: "data" },
        ],
        displayType: data.displayType || "bars", // 'bars', 'circles', or 'tags'
        ...data,
      };
    }
  }

  // Update component data when values change
  function updateData(updates: any) {
    if (!isEditing) return;

    const updatedData = { ...data, ...updates };
    portfolioEditorStore.updateComponent(data.id, updatedData);
  }

  // Get a simple icon for a skill (placeholder functionality)
  function getSkillIcon(iconName: string): string {
    const icons: Record<string, string> = {
      design:
        "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
      code: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
      javascript:
        "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
      react:
        "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      server:
        "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
      data: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
      default: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    };

    return icons[iconName] || icons.default;
  }
</script>

<section class="py-16 bg-white">
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-4">{data.title}</h2>
      <p class="text-xl text-neutral-600 max-w-3xl mx-auto">{data.subtitle}</p>
    </div>

    {#if data.displayType === "bars"}
      <!-- Skills with progress bars -->
      <div class="max-w-3xl mx-auto space-y-6">
        {#each data.skills || [] as skill}
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-base font-medium text-neutral-900"
                >{skill.name}</span
              >
              <span class="text-sm font-medium text-neutral-700"
                >{skill.level}%</span
              >
            </div>
            <div class="w-full bg-neutral-200 rounded-full h-2.5">
              <div
                class="bg-primary-600 h-2.5 rounded-full"
                style="width: {skill.level}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if data.displayType === "circles"}
      <!-- Skills with circular progress -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {#each data.skills || [] as skill}
          <div class="flex flex-col items-center">
            <div class="relative w-24 h-24">
              <!-- Background circle -->
              <svg class="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  stroke-width="3"
                  stroke-dasharray="100, 100"
                />
                <!-- Foreground circle -->
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4F46E5"
                  stroke-width="3"
                  stroke-dasharray="{skill.level}, 100"
                  stroke-linecap="round"
                />
              </svg>
              <!-- Icon in the center -->
              <div class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d={getSkillIcon(skill.icon)}
                  />
                </svg>
              </div>
            </div>
            <p class="mt-3 font-medium text-neutral-900">{skill.name}</p>
            <p class="text-sm text-neutral-500">{skill.level}%</p>
          </div>
        {/each}
      </div>
    {:else}
      <!-- Skills as tags -->
      <div class="flex flex-wrap justify-center gap-4">
        {#each data.skills || [] as skill}
          <div class="bg-neutral-100 px-4 py-3 rounded-lg">
            <div class="flex items-center">
              <svg
                class="w-5 h-5 text-primary-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d={getSkillIcon(skill.icon)}
                />
              </svg>
              <span class="font-medium text-neutral-900">{skill.name}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

{#if isEditing}
  <div class="bg-neutral-50 p-4 border-t border-neutral-200">
    <div class="text-sm text-neutral-500">
      Click to edit skills, adjust proficiency levels, and change display style.
    </div>
  </div>
{/if}
