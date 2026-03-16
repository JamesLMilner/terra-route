# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 0.0.15 (2026-03-16)


### fix

* ensure package-lock.json is correct ([](https://github.com/JamesLMilner/terra-route/commit/9240fba53bdc5a17c206fbecedbeedf6ad09af74))
* revert back to simple working implementation ([](https://github.com/JamesLMilner/terra-route/commit/aea3411181034e5104e8b8ae618b64e86ee5105b))
* skip visited nodes ([](https://github.com/JamesLMilner/terra-route/commit/02e04446462750b39ccf127155cb9d8ae7459090))


### test

* adds tests for graph ([](https://github.com/JamesLMilner/terra-route/commit/aa230c85804f68fdd337e032105dbf0291338a9c))
* improve testing around the library ([](https://github.com/JamesLMilner/terra-route/commit/8affef59af2e683cc53ef856fafadd5867522385))


### docs

* add in the logo and shorten the example ([](https://github.com/JamesLMilner/terra-route/commit/a102d1b02caec9de2727f6515abb77267ebb8178))
* fix alignment after previous commit ([](https://github.com/JamesLMilner/terra-route/commit/c0366de4d2ba0a3b6527aa5bc0ef1b87397c0865))
* improve rendering of graph in README ([](https://github.com/JamesLMilner/terra-route/commit/29b34559582679194c2812eb98cd08b6e32671db))
* TerraDraw -> Terra Draw ([](https://github.com/JamesLMilner/terra-route/commit/0644d999fbe50964d665b4bf3eaafc1290377197))
* update README with more accurate information ([](https://github.com/JamesLMilner/terra-route/commit/8678cbdb8700e8c37c275a156c8b97fd530aeaac))


* Merge pull request #3 from JamesLMilner/logo ([](https://github.com/JamesLMilner/terra-route/commit/418aeac2d1444b68fd993905d95795c74833ad37)), closes [#3](https://github.com/JamesLMilner/terra-route/issues/3)
* Merge pull request #2 from JamesLMilner/unifiy ([](https://github.com/JamesLMilner/terra-route/commit/df9e10800e46f520133d314091e33f5b29c9afef)), closes [#2](https://github.com/JamesLMilner/terra-route/issues/2)
* Merge pull request #1 from JamesLMilner/different-heap ([](https://github.com/JamesLMilner/terra-route/commit/ae0a9b96c7820eeee3f0167cba3a0fda743b8537)), closes [#1](https://github.com/JamesLMilner/terra-route/issues/1)
* remove unused config from package.json ([](https://github.com/JamesLMilner/terra-route/commit/3d1759274ff28e2750a2568c0efdaa025756f1a7))
* fix install and tests ([](https://github.com/JamesLMilner/terra-route/commit/b9fccdacfb3493eac8785de8c0296030ab2b4200))
* bump version to 0.0.4 ([](https://github.com/JamesLMilner/terra-route/commit/788bec7831baf5571e3784df971825bd093ef695))
* add API docs link ([](https://github.com/JamesLMilner/terra-route/commit/0d47ba71e3c83fe802803b45ab302bf9f7068df0))
* Fix readme section for limitations ([](https://github.com/JamesLMilner/terra-route/commit/891caba7ec1d3bc06cc1cb085a4b907890b12bd4))
* separate out instance creation from network graph building ([](https://github.com/JamesLMilner/terra-route/commit/42459d8b40f606c10c1ea5bf5827d46bc06fd6d8))
* fix package-lock.json ([](https://github.com/JamesLMilner/terra-route/commit/26a0a6ab4984e32836a7a255cfd87d9ec050737f))
* rebuild and bump ([](https://github.com/JamesLMilner/terra-route/commit/7b2dc41c41e5aac67094ee3e816710dac3801534))
* export measurments ([](https://github.com/JamesLMilner/terra-route/commit/a4dd5f70d55fd35cbbdbcc5e12328481c326d18f))
* Initial commit ([](https://github.com/JamesLMilner/terra-route/commit/91aaadffd02ea34d58914e57b18f521188124270))


### refactor

* remove graph statistic related code from the library (#6) ([](https://github.com/JamesLMilner/terra-route/commit/1729abbaee7b37e855ea1297937578b9c05aa53b)), closes [#6](https://github.com/JamesLMilner/terra-route/issues/6)


### feat

* add additional methods for LineStringGraph ([](https://github.com/JamesLMilner/terra-route/commit/6c628dbba6ba6dd52e36e3615298fd980479b8e2))
* add expandRouteGraph method (#7) ([](https://github.com/JamesLMilner/terra-route/commit/3d1da87c2a51d63ab8ec67e581b0bdbe1d16f947)), closes [#7](https://github.com/JamesLMilner/terra-route/issues/7)
* add getUnifiedNetwork to API ([](https://github.com/JamesLMilner/terra-route/commit/44c3e2aa5f9bdd73f00495ad94bb9a4025d1f408))
* add graph properties such as number of nodes/edges and connected components ([](https://github.com/JamesLMilner/terra-route/commit/e77f5abc0baf06e29ff7f98d0a34cb704066b24c))
* export LineStringGraph for determining graph properties ([](https://github.com/JamesLMilner/terra-route/commit/f1c31d85227c1e48279f51bf9644908be060d453))
* use bidirectional astar for faster route finding ([](https://github.com/JamesLMilner/terra-route/commit/e41fbd03f319d4bfae86b19c16f24faa73c27c57))
* use fibonacci heap for performance ([](https://github.com/JamesLMilner/terra-route/commit/0c3972821735610e4acd0c6e26f1a64fc02848ac))


### perf

* improve performance by using Four-ary Heap and Compressed Sparse Row  (#5) ([](https://github.com/JamesLMilner/terra-route/commit/64796c216e6555dfe4b02aea83ba43084d74533e)), closes [#5](https://github.com/JamesLMilner/terra-route/issues/5)
* improve performance of Terra Route route method ([](https://github.com/JamesLMilner/terra-route/commit/9c1770bbb2b371fe5c7fab43a11cdc83bca2e797))
* use bi-directional A* (#8) ([](https://github.com/JamesLMilner/terra-route/commit/400d06abcc595b7428e170d8f839d09386ddc8c2)), closes [#8](https://github.com/JamesLMilner/terra-route/issues/8)
* use landmark-assisted heuristics (#11) ([](https://github.com/JamesLMilner/terra-route/commit/fa347996d6692b8e04a7d29a9f3785730f43f06d)), closes [#11](https://github.com/JamesLMilner/terra-route/issues/11)
* use peak min to improve getRoute performance (#10) ([](https://github.com/JamesLMilner/terra-route/commit/85615fe656fd4675072fbe60a25d9ac04d0f52fd)), closes [#10](https://github.com/JamesLMilner/terra-route/issues/10)


### chore

* add files to npmignore ([](https://github.com/JamesLMilner/terra-route/commit/3b04e9962ce903fd0ddfc34630aaab752e9f9995))
* add fta as analysis tool (#9) ([](https://github.com/JamesLMilner/terra-route/commit/7a9088706d8a5ca768642a231347a8c5d925f20c)), closes [#9](https://github.com/JamesLMilner/terra-route/issues/9)
* add release scripts (#13) ([](https://github.com/JamesLMilner/terra-route/commit/98d231b69bc701e8f9a228b5fa79ec5cc427b3cd)), closes [#13](https://github.com/JamesLMilner/terra-route/issues/13)
* add release workflows (#12) ([](https://github.com/JamesLMilner/terra-route/commit/0e1ad96b980b008ba479898ae462f3b000b31af5)), closes [#12](https://github.com/JamesLMilner/terra-route/issues/12)
* avoid circular dependency in unify.ts ([](https://github.com/JamesLMilner/terra-route/commit/40625e6fb639f638cc1853ac8b56b787342cd1b7))
* bump to 0.0.10 ([](https://github.com/JamesLMilner/terra-route/commit/4c4793f03104147edc28efb01d03b63b9b520171))
* bump to 0.0.11 ([](https://github.com/JamesLMilner/terra-route/commit/3564b5c93ca0a19fd79724ef430729ffd0091e1b))
* bump to 0.0.5 ([](https://github.com/JamesLMilner/terra-route/commit/42c4edbd5d55c72e5199c5f86eeb6802464f0197))
* bump to 0.0.7 ([](https://github.com/JamesLMilner/terra-route/commit/14e2eae514f4e162dcbd44af63bd15c3ec4f7887))
* bump to 0.0.9 ([](https://github.com/JamesLMilner/terra-route/commit/5b3386786e09b3634753e0acf69bdde90d535ab7))
* bump to v0.0.12 ([](https://github.com/JamesLMilner/terra-route/commit/4f68a5592a50507b9b5f7db6f8ccdd0458ce5b5c))
* bump to v0.0.12 ([](https://github.com/JamesLMilner/terra-route/commit/2963cf00e9ed8633fabf495574902c49cea71144))
* bump to v0.0.13 ([](https://github.com/JamesLMilner/terra-route/commit/411995ff01cab4efd929fcf0679935b813688503))
* bump to version 0.0.6 ([](https://github.com/JamesLMilner/terra-route/commit/51df48741672d551d7808b5f7b827d5bdec671d2))
* fix benchmarking ([](https://github.com/JamesLMilner/terra-route/commit/9a857e01aa42bcf02129769f7945b9c8709f40cf))
* lower branch coverage for now ([](https://github.com/JamesLMilner/terra-route/commit/37d4d1a9f218a08f002623bf018462d3dcb6c73f))
* refactor benchmarking to be tidier ([](https://github.com/JamesLMilner/terra-route/commit/bf59717e607f1fc92d933af8b777d254fc4f19d3))
* update benchmarks in README ([](https://github.com/JamesLMilner/terra-route/commit/8d1e2515a9f36efda17f7e1705ef0a0529462055))
* update caniuse-lite ([](https://github.com/JamesLMilner/terra-route/commit/44d18057c902d6a29bcf43b3c2600ff384829a3c))
