/**
 * A version
 */
export class Version {

    static Item = class{
        constructor(public title : string, public description : string) {
        }
    }

    constructor(public fixed_bugs : {title:string, description:string}[], public new_features : {title:string, description:string}[]) {

    }


}


/**
 * Handles versioning
 */
export class VersionService{


    public static versions : any = {

        _0_0_5: new Version(
            [

            ],
            [
                new Version.Item("Version Control", "Added ability to view version notes")
            ]
        ),

        _0_0_4: new Version(
            [

            ],
            [
                new Version.Item("Version Control", "Added version control page"),
                new Version.Item("Project Display Page", "Added date and budget editting")
            ],
        )
    }

    /**
     * Get a list of all versions
     */
    static getVersions(){
        let versions : string[] = []
        let versionsUnformatted = Object.keys(this.versions)
        versionsUnformatted.forEach((v)=>{
            versions.push(v.substring(1).replaceAll("_", "."))
        })
        return versions
    }


    /**
     * Get the release notes for a version
     * @param versionCode The version code of the version
     */
    static getReleaseNotes(versionCode : string) : Version{
        let formattedVersion = versionCode.replaceAll(".", "_")
        formattedVersion = "_" + formattedVersion
        return this.versions[formattedVersion]

    }

}