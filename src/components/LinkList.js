import React, { Component } from 'react'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'

import Link from './Link'
import { LINKS_PER_PAGE } from '../constants'

export const FEED_QUERY = gql`
  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
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
      count
    }
  }
`

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
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
`

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
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
      user {
        id
      }
    }
  }
`

class LinkList extends Component {
  // _updateCacheAfterVote = (store, createVote, linkId) => {
  //   const data = store.readQuery({ query: FEED_QUERY })
  
  //   const newLinks = data.feed.links.map(link => link.id === linkId ? { 
  //     ...link,
  //     votes: createVote.link.votes,
  //   } : link)
  
  //   store.writeQuery({ query: FEED_QUERY, data: newLinks })
  // }

  _subscribeToNewLinks = (subscribeToMore) => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        const newLink = subscriptionData.data.newLink
        const exists = prev.feed.links.find(({ id }) => id === newLink.id);
        if (exists) return prev;
  
        return Object.assign({}, prev, {
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename
          }
        })
      }
    })
  }

  _subscribeToNewVote = (subscribeToMore) => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        const newVote = subscriptionData.data.newVote

        return {
          feed: {
            ...prev.feed,
            links: prev.feed.links.map(link => {
              return link.id === newVote.link.id ? newVote.link : link
            }),
            __typename: prev.feed.__typename
          }
        }
      }
    })
  }

  _getQueryVariables = () => {
    const isNewPage = this.props.location.pathname.includes('new')
    const page = parseInt(this.props.match.params.page, 10)
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0
    const first = isNewPage ? LINKS_PER_PAGE : 100
    const orderBy = isNewPage ? 'createdAt_DESC' : null
    return { first, skip, orderBy }
  }

  _getLinksToRender = (data, isNewPage) => {
    if (isNewPage) {
      return data.feed.links
    }
    const rankedList = data.feed.links.slice()
    rankedList.sort((l1, l2) => l2.votes.length - l1.votes.length)
    return rankedList
  }

  _nextPage = (data, page) => {
    if (page <= data.feed.count / LINKS_PER_PAGE) {
      const nextPage = page + 1
      this.props.history.push(`/new/${nextPage}`)
    }
  }
  
  _previousPage = (page) => {
    if (page > 1) {
      const previousPage = page - 1
      this.props.history.push(`/new/${previousPage}`)
    }
  }

  render() {
    return (
      <Query query={FEED_QUERY} variables={this._getQueryVariables()}>
        {({loading, error, data, subscribeToMore}) => {
          if (loading) return <div>Fetching</div>
          if (error) return <div>Error</div>

          this._subscribeToNewLinks(subscribeToMore)
          this._subscribeToNewVote(subscribeToMore)

          const isNewPage = this.props.location.pathname.includes('new')
          const linksToRender = this._getLinksToRender(data, isNewPage)
          const page = parseInt(this.props.match.params.page, 10)
          const pageIndex = page
            ? (this.props.match.params.page - 1) * LINKS_PER_PAGE
            : 0

          return (
            <>
              <div>{linksToRender.map((link, index) => 
                <Link key={link.id} link={link} index={index + pageIndex} />
              )}</div>
              {isNewPage && (
                <div className="flex ml4 mv3 gray">
                  {page > 1 && <div className="pointer mr2" onClick={() => this._previousPage(page)}>
                    Previous
                  </div>}
                  {page <= data.feed.count / LINKS_PER_PAGE && <div className="pointer" onClick={() => this._nextPage(data, page)}>
                    Next
                  </div>}
                </div>
              )}
            </>
          )
        }}
      </Query>
    )
  }
}

export default LinkList