export class Commit{

    public date : Date
    constructor(date : any) {

        this.date = new Date(date)

    }


    static fromObject(obj:any){
        return new Commit(obj.commit.committer.date)
    }

    static commitAlgorithm(commits : Commit[]){
        let firstCommitTimeSeconds = commits[0].date.getTime()
        let commitTimeProportions = []
        for(let i = 0; i < commits.length - 1; i++){
            let averageCommitTime = (commits[i].date.getTime() - firstCommitTimeSeconds)/i
            let newCommitTime = commits[i+1].date.getTime() - commits[i].date.getTime()
            if(averageCommitTime == 0 || Number.isNaN(averageCommitTime)) commitTimeProportions.push(0)
            else commitTimeProportions.push(newCommitTime/averageCommitTime * (i + 1)) //Weight commit average towards later commits
        }
        let sum = 0
        commitTimeProportions.forEach((p)=>sum+=p)
        let normalisationConst = (commits.length * (commits.length+1))/2

        return sum / normalisationConst

    }

}