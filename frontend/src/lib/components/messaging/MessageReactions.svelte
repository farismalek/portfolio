<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let reactions = [];
  export let alignment = "left"; // 'left' or 'right'

  const dispatch = createEventDispatcher();

  // Group reactions by emoji
  $: groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.reaction;
    if (!acc[emoji]) {
      acc[emoji] = { emoji, count: 0, users: [] };
    }
    acc[emoji].count += 1;
    acc[emoji].users.push(reaction.user);
    return acc;
  }, {});

  // Convert to array for rendering
  $: reactionsList = Object.values(groupedReactions);

  function handleReactionClick(emoji) {
    dispatch("react", emoji);
  }
</script>

<div class="mt-1 {alignment === 'right' ? 'flex justify-end' : ''}">
  <div class="flex flex-wrap gap-1 max-w-full">
    {#each reactionsList as reaction}
      <button
        class="flex items-center space-x-1 px-1.5 py-0.5 bg-white rounded-full border border-neutral-200 shadow-sm hover:bg-neutral-50"
        title={reaction.users.map((u) => u.username || u.fullName).join(", ")}
        on:click={() => handleReactionClick(reaction.emoji)}
      >
        <span>{reaction.emoji}</span>
        <span class="text-xs text-neutral-600">{reaction.count}</span>
      </button>
    {/each}
  </div>
</div>
