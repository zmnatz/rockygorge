import React, {useCallback, useState} from "react";
import firebase from '../../api/fire'
import {Form, Select, Input, Button} from 'antd'
import {Link} from '@reach/router'

const {Option} = Select;

const Register = (props) => {
  const [values, setValues] = useState({
    email: '',
    division: '',
    team: ''
  })

  const [submitted, setSubmitted] = useState(false)

  const onSubmit=useCallback((e) => {
    e.preventDefault();
    firebase.database().ref('registration').push(values)
      .then(() => setSubmitted(true))
  }, [values, setSubmitted])

  const onChange= useCallback(({target: {name, value}}) => {
    setSubmitted(false);
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
  }, [setValues])

  const onDivisionChange = useCallback(
    (division) => setValues(prev => ({
      ...prev,
      division
    }))
    )
    
    return <React.Fragment>
    <section>
      <p>Register your team for Slug 7s today</p>
      <Form onSubmit={onSubmit} layout="horizontal">
        <Form.Item required label="Team">
          <Input required name="team" value={values.team} onChange={onChange}/>
        </Form.Item>
        <Form.Item required label="Email" >
          <Input required type="email" value={values.email} name="email" onChange={onChange}/>
        </Form.Item>
        <Form.Item required label="Division">
          <Select required name="division" onChange={onDivisionChange} value={values.division}>
            <Option value="Open">Open</Option>
            <Option value="Social">Social</Option>
            <Option value="Women's">Women's</Option>
            <Option value="U19">U19</Option>
          </Select>
        </Form.Item>

        {submitted && <div>
          <h4>Thank you for registering!</h4>
          <p>We will be in touch with more details. Register a second side for a discount. See you on June 15</p>
          <p>Officially reserve your spot by <Link to="/store/slug7s">paying</Link></p>
        </div>}
        <Button type="primary" htmlType="submit" icon={submitted ? 'check' : undefined}>Register</Button>
        <p>Any question? Reach out to us. <a href="mailto:Ctmoore72@gmail.com">
          Send us an email (ctmoore72@gmail.com)
          </a>
        </p>
      </Form>
    </section></React.Fragment>
}

export default Register;
