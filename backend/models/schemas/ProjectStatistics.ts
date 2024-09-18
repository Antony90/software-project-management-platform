import {model, Schema} from "mongoose";
import {IProjectStatistics} from "../ProjectStatistics";

const ProjectStatistics = new Schema<IProjectStatistics>({

})
export default model<IProjectStatistics>("ProjectStatistics", ProjectStatistics);