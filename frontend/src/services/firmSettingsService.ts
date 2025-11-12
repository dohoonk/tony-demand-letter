import api from './api'

export interface FirmSettings {
  id: number
  firmName: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  updatedAt: string
}

export interface UpdateFirmSettingsData {
  firmName: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
}

const firmSettingsService = {
  getFirmSettings: async (): Promise<FirmSettings> => {
    const response = await api.get('/settings/firm')
    return response.data.data
  },

  updateFirmSettings: async (data: UpdateFirmSettingsData): Promise<FirmSettings> => {
    const response = await api.put('/settings/firm', data)
    return response.data.data
  },
}

export default firmSettingsService

