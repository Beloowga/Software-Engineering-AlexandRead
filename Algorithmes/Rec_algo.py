# -*- coding: utf-8 -*-
"""
Created on Mon Nov 24 11:28:18 2025

@author: belowga
"""

#Display books that user may like
#Based on: Favourite genres and if there are: Authors of books they have favourited or read recently. 

genres_favoris = {}
auteurs_recents = {'Authors' :['Atwood', 'Rowling', 'Tolkien'],'average_ratings': [5,4,5]}
auteurs_favoris={}
genres_recents = {}
bibliotheque = {}
livres_tendances = {}
users = {}
unread_books={}

def pairs(book1,book2):
    pair = False
    c = 0
    for user in users:
        if book1 in user['recently_read'] and book2 in user['recently_read']:        
            c +=1
            if c >= 3:
                pair =  True
                break
    return [c,pair]


def k_pairs(recently_read,k=2):
    c = 0
    pairs = []
    for book1 in recently_read:
        for book2 in unread_books:
            if pairs(book1,book2)[1] and c <k:
                c+=1
                pairs.append(book2)
    return pairs
    
    

def Rec_algo():
    recs = []
    recs.append(livres_tendances)
    recs.append(k_pairs(users['recently_read'],k=3))
    for livre in bibliotheque:
        if livre['genre'] in genres_favoris or livre['genre'] in genres_recents:
            recs.append(livre)
        elif livre['auteur'] in auteurs_favoris or livre['auteur'] in auteurs_recents and livre['average_rating'] >= 3:
            recs.append(livre)
    return recs
