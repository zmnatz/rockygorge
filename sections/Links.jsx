import { Row} from "antd";
import CardLink from "../components/CardLink";
import links from "../data/links";

export default function Links () {
  return (
    <Row type="flex">
      {links.map((item) => (
        <CardLink 
          key={item?.link}
          title={item?.title}
          link={item?.link}
        >
          {item.description}
        </CardLink>
      ))}
    </Row>
  );
}
