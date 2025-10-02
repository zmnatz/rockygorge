import { Card } from "antd";
import Link from "next/link";

export default function CardLink(props) {
  return <Link href={props.link}>
    <Card title={props.title} type="inner" hoverable>
      {props.children}
    </Card>
  </Link>
}