import { Request, Response } from 'express'
import FirmSettingsService from '../services/FirmSettingsService'
import { z } from 'zod'

const updateFirmSettingsSchema = z.object({
  firmName: z.string().min(1, 'Firm name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
})

class FirmSettingsController {
  async getFirmSettings(req: Request, res: Response) {
    try {
      const settings = await FirmSettingsService.getFirmSettings()

      res.json({
        success: true,
        data: settings,
      })
    } catch (error: any) {
      console.error('Error getting firm settings:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error retrieving firm settings',
        },
      })
    }
  }

  async updateFirmSettings(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = updateFirmSettingsSchema.parse(req.body)

      const settings = await FirmSettingsService.updateFirmSettings(validatedData)

      res.json({
        success: true,
        data: settings,
        message: 'Firm settings updated successfully',
      })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        })
      }

      console.error('Error updating firm settings:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error updating firm settings',
        },
      })
    }
  }
}

export default new FirmSettingsController()

