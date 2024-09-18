export class ColourPair{
    constructor(public foreground : string, public background : string) {




    }

    private colourWithAlpha(colour : string, alpha:number){
        let commas = colour.split(",").length - 1
        if(commas == 2)return colour.replace(")", `,${alpha})`).replace("rgb(", "rgba(")
        else return colour.replace(/,[^,]+\)/, `,${alpha})`)
    }

    public foregroundWithAlpha(alpha : number){
        return this.colourWithAlpha(this.foreground, alpha)
    }
    public backgroundWithAlpha(alpha : number){
        return this.colourWithAlpha(this.background, alpha)
    }
}

export class ColourScheme{

    static colourPrimary = "#ACBABF"

    static colourSecondary = "#828385"
    static colourPrimaryLight = "#C0C0C2"
    static colourSecondaryLight = "#A0A1A4"

    static colourSecondaryDark = "#565656"
    static colourPrimaryDark = "#373737"

    static colourBackground = "#f5f5f5"

    static severeWarning = new ColourPair("rgba(255,0,0,0.7)", "rgb(255,224,223)")
    static mediumWarning = new ColourPair("rgba(255,165,0,0.7)", "rgb(255,239,222)")
    static lightWarning = new ColourPair("rgb(107,107,107)", "rgb(227,227,227)")

    static ok = new ColourPair("rgba(0, 128, 0, 0.7)", "rgb(205,255,206)")


    static complete = this.ok

    static inProgress = new ColourPair("#FFFFFF", "rgba(22,119,255,0.7)")

    static notStarted = this.severeWarning

    static optimistic = this.ok
    static mostLikely = this.inProgress
    static pessimistic = this.severeWarning

}