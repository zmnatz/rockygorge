import { Row} from "antd";
import CardLink from "../components/CardLink";
import links from "../data/links.yml";
import forms from "../data/forms.yml"

export default function Links () {
  return (<>
    <Row type="flex">
      {links.filter(item => item.header !== true).map((item) => (
        <CardLink 
          key={item?.link}
          title={item?.title}
          link={item?.link}
        >
          {item.description}
        </CardLink>
      ))}
    </Row>
    <Row type="flex">
      {forms.filter(item => item.hide !== true).map((item) => (
        <CardLink 
          key={item?.id}
          title={item?.name}
          link={'forms/${item?.id}'}
        >
          {item.description}
        </CardLink>
      ))}
    </Row>
  </>);
}
