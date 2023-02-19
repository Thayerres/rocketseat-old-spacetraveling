import * as prismicH from '@prismicio/helpers';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import Image from 'next/image';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { formatDate } from '../../utils/formatDate';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  let words = 0;

  post.data.content.map(item => {
    words += item.heading.split(' ').length;

    const bodyWords = item.body.map(item => item.text.split(' ').length);
    bodyWords.map(word => (words += word));
  });

  const readTime = Math.ceil(words / 200);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Header />
      <Image
        className={styles.image}
        src={post.data.banner.url}
        alt=""
        width={1440}
        height={400}
      />
      <div className={commonStyles.container}>
        <h1 className={styles.title}>{post.data.title}</h1>
        <div className={styles.info}>
          <span>
            <FiCalendar />
            {formatDate(post.first_publication_date)}
          </span>
          <span>
            <FiUser />
            {post.data.author}
          </span>
          <span>
            <FiClock />
            {`${readTime} min`}
          </span>
        </div>
        {post.data.content.map(content => {
          return (
            <article className={styles.content} key={content.heading}>
              <h1 className={styles.content_title}>{content.heading}</h1>
              <div
                className={styles.content_body}
                dangerouslySetInnerHTML={{
                  __html: prismicH.asHTML(content.body),
                }}
              />
            </article>
          );
        })}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const client = getPrismicClient({});
  const allPosts = await client.getAllByType('posts');

  const paths = allPosts.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}: GetStaticPropsContext<{ slug: string }>) => {
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', params.slug);

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
  };
};
