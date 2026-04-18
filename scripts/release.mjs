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
    scripts: {
        // After we bump but before we commit, we want to update all the other packages that have a dependency on the package we just bumped
        // to make sure they are using the correct version. We also want to update the package-lock.json file to make sure it is in sync with
        // the updated package.json files.
        postbump:
            "npm install --package-lock-only --no-audit --no-fund && git add package-lock.json",
    },
    // Include files staged by postbump in the release commit.
    commitAll: true,
    changelogFile: changelogPath,
    releaseCommitMessageFormat: `chore: release version {{currentTag}}`,
});
