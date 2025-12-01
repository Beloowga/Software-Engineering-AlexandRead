# -*- coding: utf-8 -*-
"""
Created on Mon Nov 24 11:28:18 2025

@author: belowga
"""

#Display books that user may like
#Based on: Favourite genres and if there are: Authors of books they have favourited or read recently. 
from random import shuffle

genres_favoris = {'genres_favoris' :['Fantasy','Sci-fi','Romance']}
auteurs_recents = {'Authors' :['Atwood', 'Rowling', 'Tolkien'],'average_ratings': [5,4,5]}
auteurs_favoris={'Authors' :['King', 'Asimov', 'Clarke'],'average_ratings': [5,4,5]}
genres_recents = ['Horror','Mystery']
bibliotheque = {'livre1':{'titre':'Book1','genre':'Fantasy','average_rating':4,'auteur' : 'auteur1'},'livre2':{'titre':'Book2','genre':'Horror','auteur':'auteur2','average_rating':5},'livre3':{'titre':'Book3','genre':'Sci-fi','average_rating':3,'auteur':'auteur3'},'livre4':{'titre':'Book4','genre':'Romance','average_rating':2,'auteur':'auteur4'},'livre5':{'titre':'Book5','genre':'Mystery','average_rating':4,'auteur':'King'}}
livres_tendances = ['TrendingBook1','TrendingBook2','TrendingBook3']
users = {'user1':{'recently_read':['BookA','BookB','BookC']},'user2':{'recently_read':['BookB','BookD','BookE']},'user3':{'recently_read':['BookA','BookC','BookF']}}
unread_books=['BookX','BookY','BookZ','BookA','BookB','BookC','BookD','BookE','BookF','Book1']

def Pairs(book1,book2):
    pair = False
    c = 0
    for user in users:
        if (book1 in user and book2 in user):        
            c +=1
            if c >= 4:
                pair =  True
                break
    return [c,pair]


def k_pairs(recently_read:list,k=2):
    c = 0
    pairs = []
    for book1 in recently_read:
        for book2 in unread_books:
            if (Pairs(book1,book2)[1] and c <k and (book2 not in recently_read)):
                c+=1
                pairs.append(book2)
    return pairs
    
    

def Rec_algo(user_id,k):
    recs = []
    for elt in livres_tendances:
        recs.append(elt)
    for elt in k_pairs(users[user_id]['recently_read'],k):
        recs.append(elt)
    for livre in bibliotheque:
        if bibliotheque[livre]['genre'] in genres_favoris or bibliotheque[livre]['genre'] in genres_recents:
            recs.append(livre)
        elif bibliotheque[livre]['auteur'] in auteurs_favoris or bibliotheque[livre]['auteur'] in auteurs_recents and bibliotheque[livre]['average_rating'] >= 3:
            recs.append(livre)
    shuffle(recs)
    return recs

print(Rec_algo('user1',3))