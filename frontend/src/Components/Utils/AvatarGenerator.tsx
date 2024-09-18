import {User} from "../../Models/DatabaseObjects/User";
import {Avatar, AvatarProps, Tooltip} from "antd";
import React from "react";

export class AvatarGenerator{


    private static getHashOfID(id : string){
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        return hash;
    }

    private static normalizeHash(hash: number, min: number, max: number) {
        return Math.floor((hash % (max - min)) + min);
    }

    private static hRange = [0, 360];
    private static sRange = [25, 50];
    private static lRange = [25, 60];

    private static generateHSL(id : string): string {
        const hash = this.getHashOfID(id);
        const h = this.normalizeHash(hash, this.hRange[0], this.hRange[1]);
        const s = this.normalizeHash(hash, this.sRange[0], this.sRange[1]);
        const l = this.normalizeHash(hash, this.lRange[0], this.lRange[1]);
        return `hsl(${h}, ${s}%, ${l}%)`;
    };


    static forUser(user : User, hoverText:boolean = false, props : AvatarProps = {}) : JSX.Element{
        return this.forName(user.getID(), user.getFullName(), hoverText, props)
    }

    static forName(id : string, name : string, hoverText:boolean = false, props : AvatarProps = {}){
        let nameWords = name.split(" ")
        let initials = nameWords[0][0] + nameWords[nameWords.length - 1][0]
        if(hoverText) return(
            <Tooltip placement="top" title={name}>
                <Avatar style={{backgroundColor:this.generateHSL(id)}} {...props} key={id}>{initials}</Avatar>
            </Tooltip>
        )
        return <Avatar style={{backgroundColor:this.generateHSL(id)}} {...props} key={id}>{initials}</Avatar>
    }



}