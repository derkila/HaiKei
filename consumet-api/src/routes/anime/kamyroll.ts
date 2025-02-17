import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { ANIME } from '@consumet/extensions';
import KamyrollManager from '../../utils/kamyroll-token';
import chalk from 'chalk';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  if (process.env.ACCESS_TOKEN === undefined) {
    console.error(chalk.red('ACCESS_TOKEN not found. Kamyroll routes are not loaded.'));
    fastify.get('/kamyroll', (_, rp) => {
      rp.status(200).send('ACCESS_TOKEN not found. Kamyroll routes are not loaded.');
    });
  } else {
    const kamyroll = await ANIME.Kamyroll.create(
      'en-US',
      (
        global as typeof globalThis & {
          CrunchyrollToken: string;
        }
      ).CrunchyrollToken
    );
    console.log(
      (
        global as typeof globalThis & {
          CrunchyrollToken: string;
        }
      ).CrunchyrollToken
    );
    fastify.get('/', (_, rp) => {
      rp.status(200).send({
        intro: 'Welcome to the kamyroll provider.',
        routes: ['/:query', '/info/:id', '/watch/:episodeId'],
        documentation: 'https://docs.consumet.org/#tag/kamyroll',
      });
    });

    fastify.get('/:query', async (request: FastifyRequest, reply: FastifyReply) => {
      const query = (request.params as { query: string }).query;
      const locale = (request.query as { locale: string }).locale;

      const kamyroll = await ANIME.Kamyroll.create(
        locale,
        (
          global as typeof globalThis & {
            CrunchyrollToken: string;
          }
        ).CrunchyrollToken
      );
      const res = await kamyroll.search(query);

      reply.status(200).send(res);
    });

    fastify.get('/info', async (request: FastifyRequest, reply: FastifyReply) => {
      const id = (request.query as { id: string }).id;
      const mediaType = (request.query as { mediaType: string }).mediaType;
      const locale = (request.query as { locale: string }).locale;

      const kamyroll = await ANIME.Kamyroll.create(
        locale,
        (
          global as typeof globalThis & {
            CrunchyrollToken: string;
          }
        ).CrunchyrollToken
      );

      if (typeof id === 'undefined')
        return reply.status(400).send({ message: 'id is required' });

      if (typeof mediaType === 'undefined')
        return reply.status(400).send({ message: 'mediaType is required' });

      try {
        const res = await kamyroll
          .fetchAnimeInfo(id, mediaType)
          .catch((err) => reply.status(404).send({ message: err }));

        reply.status(200).send(res);
      } catch (err) {
        reply
          .status(500)
          .send({ message: 'Something went wrong. Contact developer for help.' });
      }
    });

    fastify.get('/watch', async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.query as { episodeId: string }).episodeId;
      const format = (request.query as { format?: string }).format;
      const type = (request.query as { type?: string }).type;

      if (typeof episodeId === 'undefined')
        return reply.status(400).send({ message: 'episodeId is required' });

      try {
        const res = await kamyroll
          .fetchEpisodeSources(episodeId, format, type)
          .catch((err) => reply.status(404).send({ message: err }));

        reply.status(200).send(res);
      } catch (err) {
        reply
          .status(500)
          .send({ message: 'Something went wrong. Contact developer for help.' });
      }
    });
  }
};

export default routes;
