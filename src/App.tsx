import './App.css'

import { FormEvent, useState } from 'react'

import { processFormData } from './utils/formUtils'

interface FormData {
  contactMethod?: string
  profiles?: Array<{
    name?: string
    email?: string
  }>
  ssns?: string[]
}

function App() {
  const [formResult, setFormResult] = useState<FormData | null>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Get form data
    const formData = new FormData(e.currentTarget)

    // Process the form data using our generic function
    const processedData = processFormData(formData)

    // Update state with the processed data
    setFormResult(processedData)
  }

  return (
    <div className="app-container">
      <h1>Form Data Parser</h1>

      <div className="form-container">
        <form id="profilesForm" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Select your preferred contact method:</legend>
            <label>
              <input type="radio" name="contactMethod" value="email" defaultChecked />
              Email
            </label>
            <label>
              <input type="radio" name="contactMethod" value="phone" />
              Phone
            </label>
            <label>
              <input type="radio" name="contactMethod" value="mail" />
              Mail
            </label>
          </fieldset>

          <div className="profile" data-profile-index="0">
            <h3>Profile 1</h3>
            <div className="input-group">
              <input type="text" name="profile[0][name]" placeholder="Name" />
              <input type="text" name="profile[0][email]" placeholder="Email" />
            </div>
          </div>

          <div className="profile" data-profile-index="1">
            <h3>Profile 2</h3>
            <div className="input-group">
              <input type="text" name="profile[1][name]" placeholder="Name" />
              <input type="text" name="profile[1][email]" placeholder="Email" />
            </div>
          </div>

          <div className="profile" data-profile-index="2">
            <h3>Profile 3</h3>
            <div className="input-group">
              <input type="text" name="profile[2][name]" placeholder="Name" />
              <input type="text" name="profile[2][email]" placeholder="Email" />
            </div>
          </div>

          <div className="profile" data-profile-index="3">
            <h3>SSNs</h3>
            <div className="input-group">
              <input type="text" name="ssns[0]" placeholder="SSN" />
              <input type="text" name="ssns[1]" placeholder="SSN" />
              <input type="text" name="ssns[2]" placeholder="SSN" />
            </div>
          </div>

          <button type="submit">Submit</button>
        </form>
      </div>

      {formResult && (
        <div className="result-container">
          <h2>Form Result:</h2>
          <pre>{JSON.stringify(formResult, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default App
