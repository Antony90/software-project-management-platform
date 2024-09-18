import {useState} from "react";

//create your forceUpdate hook
export function useForceUpdate(){
    const [_, setValue] = useState(0);
    return () => setValue(value => value + 1);
}