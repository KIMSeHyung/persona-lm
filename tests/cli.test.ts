import { afterEach, describe, expect, it, vi } from "vitest";

const { runPersonaMirrorLauncherMock } = vi.hoisted(() => ({
  runPersonaMirrorLauncherMock: vi.fn()
}));

vi.mock("../src/runtime/prompt/run-persona-mirror", () => ({
  runPersonaMirrorLauncher: runPersonaMirrorLauncherMock
}));

import { parsePersonalmCliArgs, runPersonalmCli } from "../src/cli";

describe("personalm CLI", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("treats mirror as an explicit subcommand", () => {
    expect(parsePersonalmCliArgs(["mirror", "--mode", "locked", "질문"])).toEqual({
      command: "mirror",
      forwardedArgs: ["--mode", "locked", "질문"]
    });
  });

  it("defaults to mirror mode when no subcommand is given", () => {
    expect(parsePersonalmCliArgs(["--mode", "dev_feedback", "질문"])).toEqual({
      command: "mirror",
      forwardedArgs: ["--mode", "dev_feedback", "질문"]
    });
  });

  it("forwards mirror args to the persona mirror launcher", async () => {
    runPersonaMirrorLauncherMock.mockResolvedValueOnce(0);

    await expect(
      runPersonalmCli(["mirror", "--mode", "dev_feedback", "질문"])
    ).resolves.toBe(0);

    expect(runPersonaMirrorLauncherMock).toHaveBeenCalledWith([
      "--mode",
      "dev_feedback",
      "질문"
    ]);
  });
});
