import os from "os"
import semver from "semver"
import * as core from "@actions/core"
import * as tc from "@actions/tool-cache"
import * as fs from "fs"
import { HttpClient } from "@actions/http-client"
import { exec } from "@actions/exec"
import * as path from "path"

export async function run() {
  try {
    const kubeConfig = getKubeConfig()
    const kubeVersion = await getKubeVersion()
    await fetchKubectl(kubeVersion)
    storeKubeConfig(kubeConfig)
    await validateKubeConfig()
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function fetchKubectl(kubeVersion: string): Promise<void> {
  let toolPath = tc.find("kubectl", kubeVersion)

  if (toolPath) {
    core.info(`Found kubectl in cache ${toolPath}`)
  } else {
    const osPlatform = os.platform()
    const osArch = os.arch()

    const kubectlPath = await downloadKubectlExecutable(kubeVersion)
    await exec("chmod", ["+x", kubectlPath], { silent: true })
    toolPath = await tc.cacheFile(
      kubectlPath,
      "kubectl",
      "kubectl",
      kubeVersion
    )
    core.addPath(toolPath)
  }
}

async function downloadKubectlExecutable(kubeVersion: string): Promise<string> {
  core.info(`Downloading kubectl version ${kubeVersion}`)
  const url = getExecutableDownloadUrl(kubeVersion)
  try {
    return await tc.downloadTool(url)
  } catch (e) {
    if (e instanceof tc.HTTPError && e.httpStatusCode == 404) {
      throw new Error(`kubectl version ${kubeVersion} does not exist`)
    } else {
      throw e
    }
  }
}

function storeKubeConfig(kubeConfig: string): void {
  const kubeConfigPath = newTemporaryFile("kubeconfig")
  core.debug(`Writing kubeconfig contents to ${kubeConfigPath}`)
  fs.writeFileSync(kubeConfigPath, kubeConfig)
  core.exportVariable("KUBECONFIG", kubeConfigPath)
}

function getKubeConfig(): string {
  const config = core.getInput("kube-config", { required: true })
  return Buffer.from(config, "base64").toString("utf-8")
}

async function getKubeVersion(): Promise<string> {
  const kubeVersionUrl =
    "https://storage.googleapis.com/kubernetes-release/release/stable.txt"

  const version: string = core.getInput("kube-version")

  if (version != "") {
    const parsedVersion = semver.clean(version)
    if (parsedVersion == null) {
      throw new Error(
        "kube-version is malformed, please follow semver specs (e.g. 1.2.3)"
      )
    } else {
      return parsedVersion
    }
  } else {
    const httpClient = new HttpClient("setup-kubectl", [], {
      allowRetries: true,
      maxRetries: 3
    })
    const response = await httpClient.get(kubeVersionUrl)
    return semver.valid(await response.readBody())!
  }
}

async function validateKubeConfig(): Promise<void> {
  try {
    await exec("kubectl", ["config", "current-context"], { silent: true })
  } catch (e) {
    throw new Error(
      "kube-config is not a valid base64 encoded kubernetes config"
    )
  }
}

function getExecutableDownloadUrl(kubeVersion: string): string {
  return `https://storage.googleapis.com/kubernetes-release/release/v${kubeVersion}/bin/linux/amd64/kubectl`
}

function newTemporaryFile(prefix: string): string {
  const directory = process.env["RUNNER_TEMP"] || ""
  return path.join(directory, `${prefix}_${Date.now()}`)
}
