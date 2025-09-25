import { Row, Column } from "antd";
import CardLink from "../components/CardLink";
import StoreItems from "../data/store.yml";

export default function () {
  return (
    <Row type="flex">
      {StoreItems.filter(item => !item.hide).map((item) => (
        <CardLink
          key={item.description}
          title={item?.description}
          link={`/${item.name}`}
        >
          <span><p>{item.info}</p>
          {item.subscriptions != null &&
            <p>Monthly Option Available</p>
          }</span>
        </CardLink>
      ))}
    </Row>
  );
}
