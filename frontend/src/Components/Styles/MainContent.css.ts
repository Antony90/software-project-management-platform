import {ColourScheme} from "./ColourScheme";

export const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    height: 64,
    paddingInline: 50,
    lineHeight: '64px',
    backgroundColor: ColourScheme.colourPrimary,
    borderBottom:'2px solid ' + ColourScheme.colourPrimary,
  };
  
export const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    minHeight: 120,
    lineHeight: '120px',
    color: '#fff',
    overflow:"auto",
    padding:"20px",
    width: "100vw"
};
  