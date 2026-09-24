import { declareComponent } from "@webflow/react";
import { props } from "@webflow/data-types";
import { StatCounter } from "./StatCounter";
import "./StatCounter.module.css";

export default declareComponent(StatCounter, {
  name: "Stat Counter",
  description:
    "A headline number that counts up when it scrolls into view. Respects reduced-motion preferences.",
  group: "RCA",
  props: {
    value: props.Number({
      name: "Value",
      defaultValue: 600,
      min: 0,
      decimals: 0,
    }),
    prefix: props.Text({
      name: "Prefix",
      defaultValue: "",
    }),
    suffix: props.Text({
      name: "Suffix",
      defaultValue: "+",
    }),
    label: props.Text({
      name: "Label",
      defaultValue: "Shopify stores launched",
    }),
    duration: props.Number({
      name: "Duration (ms)",
      defaultValue: 1600,
      min: 0,
      max: 10000,
      decimals: 0,
    }),
    tone: props.Variant({
      name: "Tone",
      options: ["light", "dark", "accent"],
      defaultValue: "light",
    }),
  },
});
