<template>
  <AdminLayout v-if="auth.isSuperadmin" />
  <DefaultLayout v-else />
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from './DefaultLayout.vue'
import AdminLayout from './AdminLayout.vue'

const auth = useAuthStore()
</script>
