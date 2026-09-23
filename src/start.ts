import { createAlphaReadModelFileResolver } from './alphaReadModelFileResolver.js';
import { ensureFoundationRuntimeSeed } from './foundationRuntimeSeed.js';
import { createBorHttpServer } from './httpRuntime.js';
import { BOR_PRODUCT, BOR_RUNTIME_VERSION } from './runtime.js';

const rawPort = process.env.PORT ?? '3000';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const host = process.env.HOST?.trim() || '0.0.0.0';
const foundationSeed = ensureFoundationRuntimeSeed(process.env);
const resolveAlphaReadModel = createAlphaReadModelFileResolver(process.env);
const server = createBorHttpServer(process.env, resolveAlphaReadModel);

server.listen(port, host, () => {
  process.stdout.write(JSON.stringify({
    event: 'BOR_RUNTIME_LISTENING',
    product: BOR_PRODUCT,
    version: BOR_RUNTIME_VERSION,
    host,
    port,
    alphaReadModelSource: process.env.BOR_ALPHA_READ_MODEL_PATH?.trim() ? 'READ_ONLY_FILE' : 'UNCONFIGURED',
    foundationSeed: foundationSeed ? {
      seeded: foundationSeed.seeded,
      contentFingerprint: foundationSeed.contentFingerprint,
      executionAuthority: false,
      reportPublicationAuthority: false,
      botDependency: false,
    } : null,
    tradingAuthority: false,
    botDependency: false,
  }) + '\n');
});
