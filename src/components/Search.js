import React, { useState } from 'react'
import { withApollo } from 'react-apollo'
import gql from 'graphql-tag'
import Link from './Link'

const FEED_SEARCH_QUERY = gql`
  query FeedSearchQuery($filter: String!) {
    feed(filter: $filter) {
      links {
        id
        createdAt
        description
        url
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
    }
  }
`

const Search = ({ client }) => {
  const [ links, setLinks ] = useState([])
  const [ filter, setFilter ] = useState('')
  const [ loading, setLoading ] = useState(false)

  const _executeSearch = async () => {
    setLoading(true)
    const result = await client.query({
      query: FEED_SEARCH_QUERY,
      variables: { filter },
   })
   const links = result.data.feed.links
   console.log(links)
   setLinks(links)
   setLoading(false)
  }

  return (
    <div>
      <div>
        Search
        <input
          type='text'
          onChange={e => setFilter(e.target.value)}
        />
        <button onClick={() => _executeSearch()}>OK</button>
      </div>
      {loading ? <span>Loading...</span> : links.map((link, index) => (
        <Link key={link.id} link={link} index={index} />
      ))}
    </div>
  )
}

export default withApollo(Search)