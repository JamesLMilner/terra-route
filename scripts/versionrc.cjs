const path = require("node:path");

const packageJsonPath = path.resolve(__dirname, "../package.json");
const changelogPath = path.resolve(__dirname, "../CHANGELOG.md");

module.exports = {
    preset: "conventionalcommits",
    bumpFiles: [
        {
            filename: packageJsonPath,
            type: "json",
        },
    ],
    packageFiles: [packageJsonPath],
    writerOpts: {
        transform: (commit) => {
            if (commit.header.includes("automated update")) {
                return null;
            }

            return commit;
        },
    },
    changelogFile: changelogPath,
    releaseCommitMessageFormat: "chore: release version {{currentTag}}",
};
