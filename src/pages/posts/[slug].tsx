import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import { RichText } from "prismic-dom"
import { getPrismicClient } from "../../services/prismic"
import Head from 'next/head'

import styles from './post.module.scss'

interface PostProps {
    post: {
        slug: string;
        title: string;
        content: string;
        excerpt: string;
        updatedAt: string;
    }
}

export default function Post({ post }: PostProps) {
    return (
        <>
            <Head>
                <title>{post.title} | Ignews</title>
                <meta name="description" content={post.excerpt} />
            </Head>

            <main className={styles.container}>
                <article className={styles.post}>
                    <h1>{post.title}</h1>
                    <time>{post.updatedAt}</time>
                    <div
                        className={styles.postContent}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </main>
        </>

    )
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
    const session = await getSession({ req })
    const { slug } = params

    const prismic = getPrismicClient(req)

    const response = await prismic.getByUID('publication', String(slug), {})

    const post = {
        slug: slug,
        title: RichText.asText(response.data.title),
        content: RichText.asHtml(response.data.content),
        excerpt: response.data.content.find(content => content.type === 'paragraph')?.text ?? '',
        updatedAt: new Date(response.last_publication_date).toLocaleDateString('pt-br', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    return {
        props: {
            post
        }
    }
}