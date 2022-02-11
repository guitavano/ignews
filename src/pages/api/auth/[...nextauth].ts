import { query as q } from 'faunadb'

import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github";

import { fauna } from '../../../services/fauna'

export default NextAuth({
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: 'read:user',
                },
            },
        })
    ],
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            const userEmail = user.email

            try {
                await fauna.query(
                    q.If(
                        q.Not(
                            q.Exists(
                                q.Match(
                                    q.Index('user_by_email'),
                                    q.Casefold(userEmail)
                                )
                            )
                        ),
                        q.Create(
                            q.Collection('users'),
                            { data: { userEmail } }
                        ),
                        q.Get(
                            q.Match(
                                q.Index('user_by_email'),
                                q.Casefold(userEmail)
                            )
                        )
                    )
                )
                return true
            } catch {
                return false
            }

        },
    }
})