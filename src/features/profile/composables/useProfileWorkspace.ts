import axios from '@/axios'
import { ROUTE_NAMES } from '@/router'
import { useUserStore } from '@/stores/userStore'
import type { ProfileTrendData, ProfileUpdateRequest, Response } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { useClipboard } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

interface ProfileFormState {
  name: string
  email: string
  newPassword: string
  confirmPassword: string
}

interface ProfileActivityDailyEntry {
  date: string
  totalAttempts: number
  correctAttempts: number
}

export interface PasswordRuleState {
  key: string
  label: string
  passed: boolean
}

export interface PasswordStrengthState {
  label: string
  value: number
  barClass: string
  description: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_SPECIAL_PATTERN = /[!@#$%^&*(),.?":{}|<>]/
const CORRECT_BAR_COLOR = '#10B981'
const INCORRECT_BAR_COLOR = '#F59E0B'

export const useProfileWorkspace = () => {
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)
  const router = useRouter()

  const form = reactive<ProfileFormState>({
    name: user.value.name,
    email: user.value.email,
    newPassword: '',
    confirmPassword: '',
  })

  const isSavingName = ref(false)
  const isSavingEmail = ref(false)
  const isSavingPassword = ref(false)
  const isSaving = computed(
    () => isSavingName.value || isSavingEmail.value || isSavingPassword.value,
  )
  const isLoggingOut = ref(false)
  const isPasswordEditing = ref(false)
  const isActivityLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const lastSavedAt = ref<Date | null>(null)
  const { copy: copyToClipboard, isSupported: isClipboardSupported } = useClipboard()

  const activityChartData = shallowRef<ChartData<'bar'>>({ labels: [], datasets: [] })
  const activityChartOptions = shallowRef<ChartOptions<'bar'>>({})

  const trimmedName = computed(() => form.name.trim())
  const trimmedEmail = computed(() => form.email.trim())

  const displayName = computed(() => trimmedName.value || 'Guest User')
  const displayEmail = computed(() => trimmedEmail.value || 'No email provided')
  const displayRole = computed(() => user.value.role || 'Member')
  const userId = computed(() => user.value.user_id)

  const initials = computed(() => {
    const nameSegments = trimmedName.value
      .split(/\s+/)
      .map((segment) => segment.trim())
      .filter(Boolean)

    if (nameSegments.length > 0) {
      return nameSegments
        .slice(0, 2)
        .map((segment) => segment.charAt(0).toUpperCase())
        .join('')
    }

    return (trimmedEmail.value.charAt(0) || 'U').toUpperCase()
  })

  const nameError = computed(() => {
    if (!trimmedName.value) return 'Name is required.'
    if (trimmedName.value.length < 2) return 'Name must be at least 2 characters.'
    return ''
  })

  const emailError = computed(() => {
    if (!trimmedEmail.value) return 'Email is required.'
    if (!EMAIL_PATTERN.test(trimmedEmail.value)) return 'Please enter a valid email address.'
    return ''
  })

  const hasProfileChanges = computed(() => {
    return trimmedName.value !== user.value.name || trimmedEmail.value !== user.value.email
  })

  const passwordRules = computed<PasswordRuleState[]>(() => [
    {
      key: 'length',
      label: 'At least 8 characters',
      passed: form.newPassword.length >= 8,
    },
    {
      key: 'uppercase',
      label: 'Contains an uppercase letter',
      passed: /[A-Z]/.test(form.newPassword),
    },
    {
      key: 'number',
      label: 'Contains a number',
      passed: /[0-9]/.test(form.newPassword),
    },
    {
      key: 'special',
      label: 'Contains a special symbol',
      passed: PASSWORD_SPECIAL_PATTERN.test(form.newPassword),
    },
  ])

  const passwordScore = computed(() => passwordRules.value.filter((rule) => rule.passed).length)
  const hasPasswordInput = computed(
    () => form.newPassword.length > 0 || form.confirmPassword.length > 0,
  )
  const passwordMismatch = computed(
    () => form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword,
  )

  const passwordStrength = computed<PasswordStrengthState>(() => {
    if (passwordScore.value <= 1) {
      return {
        label: 'Weak',
        value: 25,
        barClass: 'bg-red-500',
        description: 'Too easy to guess. Add more complexity.',
      }
    }

    if (passwordScore.value === 2) {
      return {
        label: 'Fair',
        value: 50,
        barClass: 'bg-orange-500',
        description: 'Needs stronger character variety.',
      }
    }

    if (passwordScore.value === 3) {
      return {
        label: 'Good',
        value: 75,
        barClass: 'bg-blue-500',
        description: 'Good baseline for a secure password.',
      }
    }

    return {
      label: 'Strong',
      value: 100,
      barClass: 'bg-emerald-500',
      description: 'Strong password quality.',
    }
  })

  const passwordError = computed(() => {
    if (!hasPasswordInput.value) return ''
    if (!form.newPassword || !form.confirmPassword) return 'Please fill in both password fields.'
    if (passwordMismatch.value) return 'Passwords do not match.'
    if (passwordScore.value < 3) return 'Password is too weak. Improve it before saving.'
    return ''
  })

  const hasPasswordChanges = computed(() => hasPasswordInput.value && !passwordError.value)
  const unsavedChangesCount = computed(
    () => Number(hasProfileChanges.value) + Number(hasPasswordInput.value),
  )

  const lastSavedLabel = computed(() => {
    if (!lastSavedAt.value) return 'Not synced in this session'

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(lastSavedAt.value)
  })

  const parseDate = (value: string) => {
    const normalized = value.includes('T') ? value : `${value}T00:00:00`
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const formatDateLabel = (value: string) => {
    const date = parseDate(value)
    if (!date) return value

    return date.toLocaleDateString(undefined, {
      month: 'numeric',
      day: 'numeric',
    })
  }

  const buildFallbackDailyEntries = (): ProfileActivityDailyEntry[] => {
    const entries: ProfileActivityDailyEntry[] = []
    const today = new Date()

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today)
      date.setDate(today.getDate() - index)
      entries.push({
        date: date.toISOString().slice(0, 10),
        totalAttempts: 0,
        correctAttempts: 0,
      })
    }

    return entries
  }

  const sortAndTrimDailyEntries = (entries: ProfileActivityDailyEntry[]) => {
    return [...entries]
      .sort((left, right) => {
        const leftTime = parseDate(left.date)?.getTime() ?? 0
        const rightTime = parseDate(right.date)?.getTime() ?? 0
        return leftTime - rightTime
      })
      .slice(-7)
  }

  const updateActivityChart = (entries: ProfileActivityDailyEntry[]) => {
    const normalizedEntries =
      entries.length > 0 ? sortAndTrimDailyEntries(entries) : buildFallbackDailyEntries()

    activityChartData.value = {
      labels: normalizedEntries.map((entry) => formatDateLabel(entry.date)),
      datasets: [
        {
          label: 'Correct',
          data: normalizedEntries.map((entry) => entry.correctAttempts),
          backgroundColor: CORRECT_BAR_COLOR,
          borderRadius: 8,
        },
        {
          label: 'Incorrect',
          data: normalizedEntries.map((entry) =>
            Math.max(entry.totalAttempts - entry.correctAttempts, 0),
          ),
          backgroundColor: INCORRECT_BAR_COLOR,
          borderRadius: 8,
        },
      ],
    }

    activityChartOptions.value = {
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.22)',
          },
          ticks: {
            precision: 0,
          },
          title: {
            display: true,
            text: 'Attempts',
          },
        },
      },
    }
  }

  const fetchProfileTrendEntries = async () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const response = await axios.get<Response<ProfileTrendData>>('/profile/trend', {
      params: {
        username: user.value.name,
        days: 7,
        tz: timeZone,
      },
    })

    return (response.data.data?.daily_trend ?? []).map((entry) => {
      const totalAttempts = Math.max(
        Math.trunc(
          typeof entry.incorrect_attempts === 'number'
            ? entry.correct_attempts + entry.incorrect_attempts
            : entry.total_attempts,
        ),
        0,
      )
      const correctAttempts = Math.min(
        Math.max(Math.trunc(entry.correct_attempts), 0),
        totalAttempts,
      )

      return {
        date: entry.date,
        totalAttempts,
        correctAttempts,
      }
    })
  }

  const loadProfileActivityChart = async () => {
    if (!user.value.name) {
      updateActivityChart(buildFallbackDailyEntries())
      return
    }

    isActivityLoading.value = true

    try {
      const entries: ProfileActivityDailyEntry[] | null = await fetchProfileTrendEntries().catch(
        () => null,
      )

      updateActivityChart(entries ?? buildFallbackDailyEntries())
    } catch {
      updateActivityChart(buildFallbackDailyEntries())
    } finally {
      isActivityLoading.value = false
    }
  }

  watch(
    () => [user.value.name, user.value.email] as const,
    ([nextName, nextEmail], [previousName, previousEmail]) => {
      const hasDraftAgainstPrevious =
        form.name.trim() !== previousName || form.email.trim() !== previousEmail

      if (!hasDraftAgainstPrevious) {
        form.name = nextName
        form.email = nextEmail
      }
    },
  )

  watch(
    () => user.value.name,
    (nextName, previousName) => {
      if (!nextName || nextName === previousName) return
      void loadProfileActivityChart()
    },
  )

  const clearMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
  }

  const clearPasswordFields = () => {
    form.newPassword = ''
    form.confirmPassword = ''
  }

  const saveName = async () => {
    clearMessages()

    if (isSavingName.value) return

    if (nameError.value) {
      errorMessage.value = nameError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: trimmedName.value !== user.value.name ? trimmedName.value : null,
      new_email: null,
      new_password: null,
    }

    if (!payload.new_name) return

    isSavingName.value = true

    try {
      const response = await axios.post<Response<unknown>>('/profile', payload)
      if (response.data.code !== 200) {
        throw new Error(response.data.info || 'Failed to update display name.')
      }

      userStore.patchUser({
        name: payload.new_name ?? user.value.name,
      })

      form.name = payload.new_name ?? user.value.name
      lastSavedAt.value = new Date()
      successMessage.value = response.data.info || 'Display name updated.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to update display name.'
    } finally {
      isSavingName.value = false
    }
  }

  const saveEmail = async () => {
    clearMessages()

    if (isSavingEmail.value) return

    if (emailError.value) {
      errorMessage.value = emailError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: null,
      new_email: trimmedEmail.value !== user.value.email ? trimmedEmail.value : null,
      new_password: null,
    }

    if (!payload.new_email) return

    isSavingEmail.value = true

    try {
      const response = await axios.post<Response<unknown>>('/profile', payload)
      if (response.data.code !== 200) {
        throw new Error(response.data.info || 'Failed to update email address.')
      }

      userStore.patchUser({
        email: payload.new_email ?? user.value.email,
      })

      form.email = payload.new_email ?? user.value.email
      lastSavedAt.value = new Date()
      successMessage.value = response.data.info || 'Email address updated.'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to update email address.'
    } finally {
      isSavingEmail.value = false
    }
  }

  const startPasswordEditing = () => {
    if (isSavingPassword.value) return

    clearMessages()
    isPasswordEditing.value = true
  }

  const cancelPasswordEditing = () => {
    clearPasswordFields()
    isPasswordEditing.value = false
    clearMessages()
  }

  const savePassword = async () => {
    clearMessages()

    if (isSavingPassword.value || !isPasswordEditing.value) return

    if (!hasPasswordInput.value) {
      errorMessage.value = 'Please enter and confirm your new password.'
      return
    }

    if (passwordError.value) {
      errorMessage.value = passwordError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: null,
      new_email: null,
      new_password: form.newPassword,
    }

    isSavingPassword.value = true

    try {
      const response = await axios.post<Response<unknown>>('/profile', payload)
      if (response.data.code !== 200) {
        throw new Error(response.data.info || 'Failed to update password.')
      }

      clearPasswordFields()
      isPasswordEditing.value = false
      lastSavedAt.value = new Date()
      successMessage.value = response.data.info || 'Password updated successfully.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to update password.'
    } finally {
      isSavingPassword.value = false
    }
  }

  const copyUserId = async () => {
    clearMessages()

    const userId = user.value.user_id?.trim()
    if (!userId) {
      errorMessage.value = 'User ID is unavailable.'
      return
    }

    if (!isClipboardSupported.value) {
      errorMessage.value = 'Clipboard is not available in this browser.'
      return
    }

    try {
      await copyToClipboard(userId)
      successMessage.value = 'User ID copied to clipboard.'
    } catch {
      errorMessage.value = 'Unable to copy User ID.'
    }
  }

  const logout = async () => {
    isLoggingOut.value = true
    clearMessages()

    try {
      await axios.post('/logout')
    } catch {
      // Keep local logout flow even if server logout fails.
    } finally {
      userStore.clearUser()
      isLoggingOut.value = false
      await router.push({ name: ROUTE_NAMES.login })
    }
  }

  onMounted(() => {
    void loadProfileActivityChart()
  })

  return {
    form,
    isSaving,
    isSavingName,
    isSavingEmail,
    isSavingPassword,
    isLoggingOut,
    isPasswordEditing,
    isActivityLoading,
    errorMessage,
    successMessage,
    displayName,
    displayEmail,
    displayRole,
    userId,
    initials,
    nameError,
    emailError,
    hasProfileChanges,
    hasPasswordInput,
    hasPasswordChanges,
    passwordRules,
    passwordStrength,
    passwordError,
    unsavedChangesCount,
    lastSavedLabel,
    activityChartData,
    activityChartOptions,
    saveName,
    saveEmail,
    startPasswordEditing,
    cancelPasswordEditing,
    savePassword,
    copyUserId,
    logout,
  }
}
