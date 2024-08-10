import HttpServer from "./core/http-server";
import { loadParameters } from "./core/configuration/parameters";
import ServerConfiguration from "./core/configuration/server-configuration";
import TerraServerClient from "./core/terra-server-client";
import TerraServerManager from "./core/terra-server-manager";


const parameters = loadParameters();
if (!parameters?.configuration) {
  throw "Must provide --configuration parameter";
}

const configuration = await ServerConfiguration.load(!!parameters.dev, parameters.configuration);
const state = {
  stopped: false,
};

const terraServerManager = new TerraServerManager();
const terraServerClient = new TerraServerClient();

const server = new HttpServer(configuration, terraServerManager, terraServerClient);


setInterval(() => {
  if (state.stopped) {
    terraServerManager.prune();
  }
}, 5000);

function stop () {
  if (!state.stopped) {
    state.stopped = true;
    server.stop();
  }

  process.exit(0);
}

process.on("SIGINT", stop);
process.on("exit", stop);
