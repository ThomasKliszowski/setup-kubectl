"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const os_1 = __importDefault(require("os"));
const semver_1 = __importDefault(require("semver"));
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const http_client_1 = require("@actions/http-client");
const exec_1 = require("@actions/exec");
const path = __importStar(require("path"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const kubeConfig = getKubeConfig();
            const kubeVersion = yield getKubeVersion();
            yield fetchKubectl(kubeVersion);
            storeKubeConfig(kubeConfig);
            yield validateKubeConfig();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
function fetchKubectl(kubeVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        let toolPath = tc.find("kubectl", kubeVersion);
        if (toolPath) {
            core.info(`Found kubectl in cache ${toolPath}`);
        }
        else {
            const osPlatform = os_1.default.platform();
            const osArch = os_1.default.arch();
            const kubectlPath = yield downloadKubectlExecutable(kubeVersion);
            yield exec_1.exec("chmod", ["+x", kubectlPath], { silent: true });
            toolPath = yield tc.cacheFile(kubectlPath, "kubectl", "kubectl", kubeVersion);
            core.addPath(toolPath);
        }
    });
}
function downloadKubectlExecutable(kubeVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info(`Downloading kubectl version ${kubeVersion}`);
        const url = getExecutableDownloadUrl(kubeVersion);
        try {
            return yield tc.downloadTool(url);
        }
        catch (e) {
            if (e instanceof tc.HTTPError && e.httpStatusCode == 404) {
                throw new Error(`kubectl version ${kubeVersion} does not exist`);
            }
            else {
                throw e;
            }
        }
    });
}
function storeKubeConfig(kubeConfig) {
    const kubeConfigPath = newTemporaryFile("kubeconfig");
    core.debug(`Writing kubeconfig contents to ${kubeConfigPath}`);
    fs.writeFileSync(kubeConfigPath, kubeConfig);
    core.exportVariable("KUBECONFIG", kubeConfigPath);
}
function getKubeConfig() {
    const config = core.getInput("kube-config", { required: true });
    return Buffer.from(config, "base64").toString("utf-8");
}
function getKubeVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeVersionUrl = "https://storage.googleapis.com/kubernetes-release/release/stable.txt";
        const version = core.getInput("kube-version");
        if (version != "") {
            const parsedVersion = semver_1.default.clean(version);
            if (parsedVersion == null) {
                throw new Error("kube-version is malformed, please follow semver specs (e.g. 1.2.3)");
            }
            else {
                return parsedVersion;
            }
        }
        else {
            const httpClient = new http_client_1.HttpClient("setup-kubectl", [], {
                allowRetries: true,
                maxRetries: 3
            });
            const response = yield httpClient.get(kubeVersionUrl);
            return semver_1.default.valid(yield response.readBody());
        }
    });
}
function validateKubeConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exec_1.exec("kubectl", ["config", "current-context"], { silent: true });
        }
        catch (e) {
            throw new Error("kube-config is not a valid base64 encoded kubernetes config");
        }
    });
}
function getExecutableDownloadUrl(kubeVersion) {
    return `https://storage.googleapis.com/kubernetes-release/release/v${kubeVersion}/bin/linux/amd64/kubectl`;
}
function newTemporaryFile(prefix) {
    const directory = process.env["RUNNER_TEMP"] || "";
    return path.join(directory, `${prefix}_${Date.now()}`);
}
//# sourceMappingURL=main.js.map