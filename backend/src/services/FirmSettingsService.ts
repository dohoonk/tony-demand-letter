import prisma from '../config/database'

interface FirmSettingsData {
  firmName: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
}

class FirmSettingsService {
  async getFirmSettings() {
    // Always get the single firm settings row (id = 1)
    let settings = await prisma.firmSettings.findUnique({
      where: { id: 1 },
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.firmSettings.create({
        data: {
          id: 1,
          firmName: 'Your Law Firm Name',
          address: '123 Legal Street, Suite 100',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          phone: '(555) 123-4567',
          email: 'contact@lawfirm.com',
        },
      })
    }

    return settings
  }

  async updateFirmSettings(data: FirmSettingsData) {
    const settings = await prisma.firmSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data,
      },
    })

    return settings
  }
}

export default new FirmSettingsService()

