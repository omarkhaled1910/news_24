import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { runNewsPipeline } from '@/utilities/cron'

export const maxDuration = 120

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    // Find videos stuck in no_transcript or failed status
    const { docs: stuckVideos } = await payload.find({
      collection: 'videos',
      where: {
        status: { in: ['no_transcript', 'failed'] },
      },
      limit: 200,
    })

    if (stuckVideos.length === 0) {
      return Response.json({
        success: true,
        message: 'No videos to reprocess',
        deleted: 0,
        pipeline: null,
      })
    }

    // Delete them so the pipeline picks them up again
    let deleted = 0
    for (const video of stuckVideos) {
      await payload.delete({
        collection: 'videos',
        id: video.id,
      })
      deleted++
    }

    payload.logger.info(`Deleted ${deleted} stuck videos for reprocessing`)

    // Run the pipeline immediately
    const pipelineResult = await runNewsPipeline()

    return Response.json({
      success: true,
      message: `Deleted ${deleted} videos and re-ran pipeline`,
      deleted,
      pipeline: pipelineResult,
    })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error reprocessing videos' })
    return new Response(
      `Error reprocessing videos: ${e instanceof Error ? e.message : 'Unknown error'}`,
      { status: 500 },
    )
  }
}
