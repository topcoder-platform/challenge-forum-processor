const config = require('config')
const { kafkaModules } = require('./modules')
const { initializeRocketClient } = require('./utils/rocket-client.util')
const { initializeKafkaClient } = require('./utils/kafka.util')

/**
 * Start the processor
 */
async function bootstrap () {
  await initializeRocketClient()
  await initializeKafkaClient(config.KAFKA, kafkaModules)
}

bootstrap()
