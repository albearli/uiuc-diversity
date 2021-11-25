import { Component, OnInit, Input, OnChanges } from "@angular/core";
import * as d3 from "d3";
import d3Tip from "d3-tip"; //d3.tip tip is not a function automatically imported with d3, d3-tip library is needed instead
import { legendColor } from "d3-svg-legend";
import * as data from "../../../assets/json/2021.json";

@Component({
  selector: "app-piechart",
  templateUrl: "./piechart.component.html",
  styleUrls: ["./piechart.component.scss"],
})
export class PiechartComponent implements OnInit, OnChanges {
  @Input() pieData: any;
  @Input() level: string;
  @Input() college: string;

  constructor() {}

  ngOnInit() {}

  ngOnChanges() {
    this.createPiechart(this.pieData, this.level);
  }

  createPiechart({ majorCode, college }: any, level: string) {
    // destructure the incoming input, grabbing only majorCode and college
    d3.select(".once").remove();
    const svg = d3
      .select("div#piecontainer")
      .append("svg")
      .attr("class", "once")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 600 380")
      .classed("svg-content", true);

    const pieGraph = svg
      .append("g")
      .attr("class", "piechart")
      .attr("transform", `translate(200, 150)`);
    let educationLevel: string;

    switch (level) {
      case "undergrad":
        educationLevel = "undergraduate";
        break;
      case "masters":
        educationLevel = "masters";
        break;
      case "doctorate":
        educationLevel = "doctorate";
        break;
      default:
        educationLevel = "nondegree";
        break;
    }

    const selectedData = data["default"][college][educationLevel].filter(
      (entry: { majorCode: any }) => entry.majorCode === majorCode
    );

    const pie = d3
      .pie()
      .sort(null)
      .value((d: { count: any }) => d.count); // pie is a function, take the race count as the variable
    const arcPath = d3.arc().innerRadius(75).outerRadius(150); // make it to a donut by specifying inner and outer radius
    const color = d3
      .scaleOrdinal(d3["schemeSet3"])
      .domain(selectedData.map((entry: { race: any }) => entry.race)); // color for each arc

    const paths = pieGraph.selectAll("path").data(pie(selectedData)); // config data to pie data

    // the animation for drawing pie chart, making startAngle starting from endAngle and ending at its own position
    const arcTweenEnter = (d: { endAngle: any; startAngle: any }) => {
      let i = d3.interpolate(d.endAngle, d.startAngle);
      return function (t: any) {
        d.startAngle = i(t);
        return arcPath(d);
      };
    };

    paths
      .enter()
      .append("path")
      .attr("d", arcPath)
      .attr("fill", (d: { data: { race: any } }) => color(d.data.race))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .transition()
      .duration(700)
      .attrTween("d", arcTweenEnter);

    // this section is for legends
    const legend = legendColor()
      .shape("path", d3.symbol().type(d3.symbolCircle)()) // making the legend pattern into circle symbol.
      .shapePadding(10)
      .scale(color);

    const legendGroup = svg.append("g").attr("transform", "translate(400, 30)");
    legendGroup.call(legend); //call the legend
    legendGroup
      .selectAll("text") //configure the text
      .attr("fill", "black")
      .attr("font-size", 12);

    // from here below is all about tooltips for piechart
    const tip = d3Tip()
      .attr("class", "d3-tip")
      .html(
        (d: {
          data: {
            race: any;
            count: number;
            total: number;
            major: any;
            degree: any;
          };
        }) => {
          return ` 
                  <div style="background-color: rgba(0,0,0,0.7); padding: 8px; color: white; text-align: center; position: relative; bottom: 0.2rem" >
                    <h5 style="font-size: 1.5rem">${d.data.race}</h5>
                    <h6><strong style="font-size: 1.2rem">${
                      d.data.count
                    }</strong><span style="font-size: 0.8rem"> out of </span><strong style="font-size: 1.2rem">${
            d.data.total
          }</strong><span style="font-size: 0.7rem"> students</span></h6>
                    <h6><strong style="font-size: 1.2rem">${(
                      (d.data.count * 100) /
                      d.data.total
                    ).toFixed(
                      2
                    )}%</strong><span style="font-size: 0.8rem"> in ${
            d.data.major
          } ${this.level !== "nondegree" ? d.data.degree : ""}</span></h6>
                  </div>
                `;
        }
      );

    pieGraph.call(tip);
    const handleMouseOver = (
      d: any,
      i: string | number,
      n: { [x: string]: any }
    ) => {
      // make the hovered part of pie chart white
      d3.select(n[i])
        .transition("changeSliceFill")
        .duration(200) // make sure it doesn't intervene the enter tween animation by naming this transition
        .attr("fill", "#fff");
    };

    const handleMouseOut = (
      d: { data: { race: any } },
      i: string | number,
      n: { [x: string]: any }
    ) => {
      // make the part back to its original color after mouseout
      d3.select(n[i])
        .transition("changeSliceFill")
        .duration(200)
        .attr("fill", color(d.data.race));
    };
    pieGraph
      .selectAll("path")
      .on(
        "mouseover",
        (d: any, i: string | number, n: { [x: string]: any }) => {
          tip.show(d, n[i]);
          handleMouseOver(d, i, n);
        }
      )
      .on("mouseout", (d: any, i: any, n: any) => {
        tip.hide();
        handleMouseOut(d, i, n);
      });
  }
}
