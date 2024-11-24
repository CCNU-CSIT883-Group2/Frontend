import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const user = ref({ name: 'Evan You', uid: '123123' })
  const name = computed(() => user.value.name)
  const uid = computed(() => user.value.uid)

  function setName(newName: string) {
    user.value.name = newName
  }

  return { user, name, uid, setName }
})

export const useUserSettingsStore = defineStore('userSettings', () => {
  const settings = ref({ darkMode: false, questions: { showDifficulty: true } })

  return { settings }
})
