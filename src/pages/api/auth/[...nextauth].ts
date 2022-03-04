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
        async session({ session, token, user }) {

            try {
                const userActiveSubscription = await fauna.query(
                    q.Get(
                        q.Intersection([
                            q.Match(
                                q.Index('subscription_by_user_ref'),
                                q.Select(
                                    "ref",
                                    q.Get(
                                        q.Match(
                                            q.Index('user_by_email'),
                                            q.Casefold(session.user.email)
                                        )
                                    )
                                )
                            ),
                            q.Match(
                                q.Index('subscription_by_status'),
                                "active"
                            )
                        ])
                    )
                )

                return {
                    ...session,
                    activeSubscription: userActiveSubscription
                }

            } catch {
                return {
                    ...session,
                    activeSubscription: null
                }
            }

        },
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