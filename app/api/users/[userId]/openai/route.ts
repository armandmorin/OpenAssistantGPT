import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { openAIConfigSchema } from "@/lib/validations/openaiConfig"

const routeContextSchema = z.object({
    params: z.object({
        userId: z.string(),
    }),
})

export async function PATCH(
    req: Request,
    context: z.infer<typeof routeContextSchema>
) {
    try {
        // Validate the route context.
        const { params } = routeContextSchema.parse(context)

        // Ensure user is authentication and has access to this user.
        const session = await getServerSession(authOptions)
        if (!session?.user || params.userId !== session?.user.id) {
            return new Response(null, { status: 403 })
        }

        // Get the request body and validate it.
        const body = await req.json()
        const payload = openAIConfigSchema.parse(body)

        // Update the user.
        await db.openAIConfig.upsert({
            where: {
                userId: session.user.id,
            },
            create: {
                userId: session.user.id,
                ...payload
            },
            update: {
                ...payload
            }
        })


        return new Response(null, { status: 200 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify(error.issues), { status: 422 })
        }
        console.error(error)

        return new Response(null, { status: 500 })
    }
}