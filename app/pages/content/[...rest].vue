<script setup lang="ts">
// Only here so a miss under /content has a route name, which is what puts its 404 in the section's color.
throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
</script>
