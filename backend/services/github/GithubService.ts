import {Octokit} from "octokit";
import {createAppAuth} from "@octokit/auth-app";
import {Commit} from "../../models/Commit";
import GithubDetails from "common/build-models/GithubDetails";

export class GithubService{


    static APP_ID = 304087
    static CLIENT_ID = "Iv1.52d49efc80273e44"

    static CLIENT_SECRET = "a35adb52bda0e93374e74e417e0fd588ed323d15"

    static PRIVATE_KEY = ("-----BEGIN RSA PRIVATE KEY-----\n" +
        "MIIEpAIBAAKCAQEA3npJg+BAMEXIhIJ1VYx/JvLrSrGhRBb46QJ21aJIMFDAJufp\n" +
        "U2JspnCUfVc8XgNIDHs6xW46aQFeoVSEAp2So7EzDDk3m8j5uAX737BayYbgJVgJ\n" +
        "BHaAQZKujgiy/ERDO0ZOlweqNd2gYzRCEwnfJBCaCxd4X638tk4+9Ut9V6zz2Ful\n" +
        "HdiCaWWB//P3nj8qTZ72WCc9Lc6Qt1D3l8K5V6AK867L6oCwzkkVGgVNJY9CHTCy\n" +
        "kp+Cho+uV1VKMX1s4g8rqv6sdndUymWk9pulXiQi5NCzVx1EoYg6nTXX1PLiujDJ\n" +
        "T6aVf1fo3oZUTHeNi3uYU3SL0Srfn5HjOcSncQIDAQABAoIBAG4r1JfvxxmglQm5\n" +
        "qO0yZA0fopEcoaWcUqrgw4RLlsAGXQFnOs5GIVPS0FW5i3Vq3pT/uTzntxkkyn3N\n" +
        "4omBCorxRzw4YWdOAQu2OuKs7Gh72CfmDqEdJapTPwmrGSd/jmOeD3EPJKUEGVbH\n" +
        "HCldbBjp976iYsPO3yRQXzENrwZo/QBIGZy8tdgOcHeXpgHkDBYQ5+v9OulyAa0s\n" +
        "dj93KziZldXdktDwyFS/prWX7z5on4NDaH03wyG21t7zGBKDlv1xWSq5/nKUvnYG\n" +
        "iFjmuLMLogDuc3BeQzZMGcjYTU3gPTVHwmtX9rzMtmGYeNlBTYLTTUykgLiZgG0+\n" +
        "WCHdDYECgYEA8OCnFp3NzTMz+2sEWxjjcxPVcI3lxMTf8X5+R9Tok4p+dDQIcXOP\n" +
        "obqCKDeinMmES8mIhRWteAScOx5qKHbevx2sRi+hFJfHbWGLAj0VI9G9qM4PP1EM\n" +
        "LrC85RUiwL2L5YhL8PEDoxiM1WaycBlWz4r235M/yTNPHKs2yslANpkCgYEA7HHq\n" +
        "Ji517xajjUE+Ecnz4Irqjtqzglv9CFRN0v1q+7ph+9jBHsN1kZjlhQUakcRPAWcN\n" +
        "65H9KRYCt4DXo96nwQWOFjbC+jrTjMT2mpay71Yw1GMj7NjSsbnV40HaqFtmtlkO\n" +
        "/FivlTy4+LGHvH5ExNkOSfiPZj0JzdmX5tp19pkCgYBxDY9+fuwDnj+MherScrj1\n" +
        "3t4zaHXpx1kv9+V/Az9xV/QHyBAaZ1mHV4kVJR+OJMqR43HOvKDhDpDg8mJywW/E\n" +
        "FUIw4tPgXWg9PyXGFDMiz6MLYkMnvXtRQqQ1hJj+Czhor3KtEAFb//7BfeTL1ii3\n" +
        "WgqKXor2fL1pwDYEMTaRKQKBgQDYJb7+joSDP7fd3qGmU28dewC3/RgS+JLU9XR7\n" +
        "h+0wGA+Q0nKg89/bbOGM+8BxNvtedd4U1s2OrK9pH2CCTn4ehzx/9CnD5NkVm80w\n" +
        "Pslu3+Udk0/5KbFahV8RNFd2hq/bzIhViaFhlTQnLOvAFdI5/Y8BcjdtKCl5RAyI\n" +
        "HneuKQKBgQCKGAhCXvXTuY34h5F+lvJueXvL2I9vp4syI5dml8wKu0PXhCdiFB9T\n" +
        "5TXCmfm6RmLEUhJ4H4EZ4xPxmT48XPsjf0w9ikfoBvMbuVE5tnyfAIqfUfynIxxM\n" +
        "40hPgUexvEOHnSrYSz4vAGUzP+KrWVqkAJuqevRk5X6BswCOcEpzNg==\n" +
        "-----END RSA PRIVATE KEY-----\n")

    private appOctokit : Octokit

    constructor(public config : GithubDetails) {
        this.appOctokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: GithubService.APP_ID,
                privateKey: GithubService.PRIVATE_KEY,
                clientId: GithubService.CLIENT_ID,
                clientSecret: GithubService.CLIENT_SECRET,
                installationId : config.installationID
            },
        });
    }


    public async listCommits(){
        let branches = await this.listBranches()
        let selectedBranch = branches.find((b)=>this.config.branchName == b.name)
        if(selectedBranch == null) throw new Error("Branch doesn't exist")

        console.log(selectedBranch.sha)
        return (await this.appOctokit
            .paginate("GET /repos/{owner}/{repo}/commits", {
                owner: this.config.repoOwner,
                repo: this.config.repoName,
                sha:selectedBranch.sha
            })).map((commit)=>Commit.fromObject(commit))
    }

    public async listBranches(repoOwner:string | null = null, repoName :string | null = null){
        if(repoOwner == null) repoOwner = this.config.repoOwner
        if(repoName == null) repoName = this.config.repoName
        return (await this.appOctokit
            .paginate("GET /repos/{owner}/{repo}/branches",{
                owner:repoOwner,
                repo:repoName
            })).map((b)=>{return{name:b.name, sha:b.commit.sha}})
    }

    public async listRepos(){
        return (await this.appOctokit
            .paginate("GET /installation/repositories"))
            .map((repo)=>{return{name: repo.name, owner:repo.owner.login, branches:[] as {name:string, sha:string}[]}})
    }

    public async getSelectableConnectionData(){
        let repos = await this.listRepos()
        for(let repo of repos){
            repo.branches = await this.listBranches(repo.owner, repo.name)
        }
        return repos
    }

    public async disconnectFromGithub(){
        await this.appOctokit.request('DELETE /app/installations/{installation_id}', {
            installation_id: Number.parseInt(this.config.installationID),
        })
    }

}