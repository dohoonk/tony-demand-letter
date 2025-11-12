import prisma from '../lib/prisma'

class VersionService {
  async createVersion(documentId: string, content: any, userId: string, note?: string) {
    // Get the current highest version number for this document
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    })

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1

    // Create the version
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersionNumber,
        content: {
          text: content,
          note: note || '',
          timestamp: new Date().toISOString(),
        },
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return version
  }

  async listVersions(documentId: string) {
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return versions
  }

  async getVersion(versionId: string) {
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!version) {
      throw new Error('Version not found')
    }

    return version
  }

  async restoreVersion(documentId: string, versionId: string, userId: string) {
    // Get the version to restore
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    })

    if (!version || version.documentId !== documentId) {
      throw new Error('Version not found')
    }

    // Update the document with the version content
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: version.content,
        updatedAt: new Date(),
      },
    })

    // Create a new version for this restoration
    await this.createVersion(
      documentId,
      (version.content as any).text,
      userId,
      `Restored from version ${version.versionNumber}`
    )

    return document
  }

  async deleteVersion(versionId: string, documentId: string) {
    // Don't allow deleting if it's the only version
    const versionCount = await prisma.documentVersion.count({
      where: { documentId },
    })

    if (versionCount <= 1) {
      throw new Error('Cannot delete the only version')
    }

    await prisma.documentVersion.delete({
      where: { id: versionId },
    })
  }
}

export default new VersionService()

