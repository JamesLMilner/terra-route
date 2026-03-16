export default (packageName, packageJsonPath, changelogPath) => ({
    preset: "conventionalcommits",
    bumpFiles: [
        {
            filename: packageJsonPath,
            type: "json",
        },
    ],
    packageFiles: [packageJsonPath],
    writerOpts: {
        transform: (commit, context) => {
            if (commit.header.includes("automated update")) {
                return null;
            }

            return commit;
        },
    },
    changelogFile: changelogPath,
    releaseCommitMessageFormat: `chore: release version {{currentTag}}`,
});
