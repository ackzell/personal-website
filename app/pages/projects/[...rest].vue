<script setup lang="ts">
// Only here so a miss deeper than a project's part has a route name, which is what puts its 404 in the section's color.
throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
</script>
