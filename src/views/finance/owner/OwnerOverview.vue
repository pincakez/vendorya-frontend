<template>
  <div>
    <!-- Totals strip -->
    <div class="om-kpis">
      <div class="om-kpi">
        <div class="om-kpi-label">{{ t('finance.owner.totals.business') }}</div>
        <div class="om-kpi-value"><Money :value="overview?.business_total || 0" /></div>
      </div>
      <div class="om-kpi">
        <div class="om-kpi-label">{{ t('finance.owner.totals.personal') }}</div>
        <div class="om-kpi-value"><Money :value="overview?.personal_total || 0" /></div>
      </div>
      <div class="om-kpi">
        <div class="om-kpi-label">{{ t('finance.owner.totals.amanat') }}</div>
        <div class="om-kpi-value"><Money :value="overview?.amanat_held || 0" /></div>
      </div>
      <div class="om-kpi">
        <div class="om-kpi-label">{{ t('finance.owner.totals.owed_by_me') }}</div>
        <div class="om-kpi-value" :class="{ 'om-neg': Number(overview?.loans_owed_by_me) > 0 }"><Money :value="overview?.loans_owed_by_me || 0" /></div>
      </div>
      <div class="om-kpi">
        <div class="om-kpi-label">{{ t('finance.owner.totals.owed_to_me') }}</div>
        <div class="om-kpi-value"><Money :value="overview?.loans_owed_to_me || 0" /></div>
      </div>
    </div>

    <div class="om-toolbar">
      <p class="om-sub">{{ t('finance.owner.overview_hint') }}</p>
      <label class="om-check">
        <input v-model="showClosed" type="checkbox" />
        <span>{{ t('finance.owner.show_closed', { n: closedCount }) }}</span>
      </label>
    </div>

    <div v-if="loading" class="om-grid"><div v-for="i in 4" :key="i" class="om-skel" /></div>
    <div v-else-if="error" class="om-empty om-error">{{ error }}</div>
    <template v-else>
      <section v-for="p in groups" :key="p.id" class="om-group" :class="{ 'om-group--personal': p.kind === 'PERSONAL' }">
        <div class="om-group-head">
          <h2 class="om-group-title">
            <component :is="partIcon(p.kind)" :size="16" />
            {{ partName(t, p) }}
            <span v-if="p.name" class="om-tag om-tag--muted">{{ partKindLabel(t, p.kind) }}</span>
            <span v-if="p.kind === 'PERSONAL'" class="om-private"><EyeOff :size="11" /> {{ t('finance.owner.only_you') }}</span>
            <button v-if="p.kind === 'BUSINESS'" class="om-row-action" :title="t('common.edit')" @click="$emit('edit-part', p)"><Pencil :size="13" /></button>
          </h2>
          <span class="om-group-total" :class="{ 'om-neg': Number(p.total) < 0 }"><Money :value="p.total ?? 0" /></span>
        </div>
        <p v-if="p.kind === 'PERSONAL'" class="om-sub" style="margin-bottom:10px">{{ t('finance.owner.personal_hint') }}</p>
        <div v-if="!p.shown.length" class="om-empty">
          {{ t('finance.owner.empty.' + (p.kind === 'PERSONAL' ? 'personal' : 'boxes')) }}
          <div style="margin-top:10px"><BaseButton size="sm" variant="secondary" @click="$emit('new-box', p.id)"><Plus :size="13" /> {{ t('finance.owner.new_box') }}</BaseButton></div>
        </div>
        <div v-else class="om-grid">
          <router-link v-for="b in p.shown" :key="b.id" :to="`/finance/my-money/box/${b.id}`" class="om-box-link">
            <BaseCard padding="md" :class="['om-box', { 'om-dim': b.is_active === false }]">
              <div class="om-box-head">
                <div class="om-box-icon"><component :is="kindIcon(b.kind)" :size="17" /></div>
                <div class="om-box-names">
                  <div class="om-box-name">{{ boxName(t, b) }}</div>
                  <div class="om-box-meta">{{ kindLabel(t, b.kind) }}<template v-if="b.branch_name"> · {{ b.branch_name }}</template></div>
                </div>
                <button v-if="canEditBox(b)" class="om-row-action" :title="t('common.edit')" @click.prevent.stop="$emit('edit-box', { ...b, part: b.part || p.id })">
                  <Pencil :size="13" />
                </button>
              </div>
              <div class="om-box-balance" :class="{ 'om-neg': Number(b.balance) < 0 }"><Money :value="b.balance ?? 0" /></div>
              <div v-if="b.is_active === false || b.is_default_drawer" style="display:flex;gap:6px;flex-wrap:wrap">
                <span v-if="b.is_default_drawer" class="om-tag">{{ t('finance.treasury.default_drawer') }}</span>
                <span v-if="b.is_active === false" class="om-tag om-tag--muted">{{ t('finance.owner.closed') }}</span>
              </div>
              <div v-else-if="b.note" class="om-muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="b.note">{{ b.note }}</div>
            </BaseCard>
          </router-link>
        </div>
      </section>

      <div v-if="!hasBusiness" class="om-empty">
        {{ t('finance.owner.empty.business') }}
        <div style="margin-top:10px"><BaseButton size="sm" variant="secondary" @click="$emit('new-part')"><Briefcase :size="13" /> {{ t('finance.owner.new_business') }}</BaseButton></div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Pencil, Plus, EyeOff, Briefcase, Store, User, Wallet, Inbox, Banknote, Landmark, Smartphone, Lock, PiggyBank,
} from 'lucide-vue-next'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { boxName, kindLabel } from '@/utils/treasury'
import { sortParts, partName, partKindLabel } from '@/utils/ownerMoney'

const props = defineProps({
  overview: { type: Object, default: null },
  loading:  { type: Boolean, default: false },
  error:    { type: String, default: '' },
})
defineEmits(['edit-part', 'edit-box', 'new-box', 'new-part'])
const { t } = useI18n()

const showClosed = ref(false)
const allParts = computed(() => sortParts(props.overview?.parts || []))
const closedCount = computed(() => allParts.value.reduce((n, p) => n + (p.boxes || []).filter(b => b.is_active === false).length, 0))
const groups = computed(() => allParts.value.map(p => ({
  ...p,
  shown: (p.boxes || []).filter(b => showClosed.value || b.is_active !== false)
    .sort((a, b) => (a.kind === 'DRAWER' ? 0 : 1) - (b.kind === 'DRAWER' ? 0 : 1) || boxName(t, a).localeCompare(boxName(t, b))),
})))
const hasBusiness = computed(() => allParts.value.some(p => p.kind === 'BUSINESS'))

const PART_ICONS = { SHOP: Store, BUSINESS: Briefcase, PERSONAL: User }
function partIcon(kind) { return PART_ICONS[kind] || Wallet }
const KIND_ICONS = { DRAWER: Inbox, CASH: Banknote, BANK: Landmark, WALLET: Smartphone, RESERVED: Lock, SAVINGS: PiggyBank }
function kindIcon(kind) { return KIND_ICONS[kind] || Wallet }
// A till drawer and the "not sorted yet" box are run from the Treasury page (branch / payment-method rules live there).
function canEditBox(b) { return b.system_role !== 'UNSORTED' && b.kind !== 'DRAWER' }
</script>
